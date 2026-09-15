import express from "express";
import path from "node:path";
import fs from "node:fs";
import { z } from "zod";
import { db, getSettings, saveSettings, type Fillup } from "./db.js";
import { enrich, summary } from "./calc.js";
import { authRouter, loadUser, requireUser } from "./auth.js";

const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(loadUser);

app.use("/api/auth", authRouter);

const fillupSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  distance_km: z.number().positive(),
  lpg_liters: z.number().positive(),
  lpg_price: z.number().positive(),
  petrol_price: z.number().positive(),
  note: z.string().max(500).nullable().optional(),
});

const settingsSchema = z.object({
  petrolConsumption: z.number().positive(),
  installCost: z.number().min(0),
});

const api = express.Router();
api.use(requireUser);

api.get("/settings", (req, res) => res.json(getSettings(req.user!.id)));

api.put("/settings", (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  saveSettings(req.user!.id, parsed.data);
  res.json(getSettings(req.user!.id));
});

api.get("/fillups", (req, res) => {
  const uid = req.user!.id;
  const s = getSettings(uid);
  const rows = db.prepare("SELECT * FROM fillups WHERE user_id = ? ORDER BY date DESC, id DESC").all(uid) as Fillup[];
  const items = rows.map((f) => enrich(f, s));
  res.json({ items, summary: summary(items, s) });
});

api.post("/fillups", (req, res) => {
  const parsed = fillupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;
  const uid = req.user!.id;
  const info = db
    .prepare(
      "INSERT INTO fillups (user_id, date, distance_km, lpg_liters, lpg_price, petrol_price, note) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(uid, d.date, d.distance_km, d.lpg_liters, d.lpg_price, d.petrol_price, d.note ?? null);
  const row = db.prepare("SELECT * FROM fillups WHERE id = ?").get(info.lastInsertRowid) as Fillup;
  res.status(201).json(enrich(row, getSettings(uid)));
});

api.put("/fillups/:id", (req, res) => {
  const parsed = fillupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;
  const uid = req.user!.id;
  const info = db
    .prepare(
      "UPDATE fillups SET date=?, distance_km=?, lpg_liters=?, lpg_price=?, petrol_price=?, note=? WHERE id=? AND user_id=?"
    )
    .run(d.date, d.distance_km, d.lpg_liters, d.lpg_price, d.petrol_price, d.note ?? null, req.params.id, uid);
  if (info.changes === 0) return res.status(404).json({ error: "not found" });
  const row = db.prepare("SELECT * FROM fillups WHERE id = ?").get(req.params.id) as Fillup;
  res.json(enrich(row, getSettings(uid)));
});

api.delete("/fillups/:id", (req, res) => {
  const info = db.prepare("DELETE FROM fillups WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
  if (info.changes === 0) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

// Delete the current user and everything attached (fillups, settings, sessions via ON DELETE CASCADE).
api.delete("/account", (req, res) => {
  db.prepare("DELETE FROM users WHERE id = ?").run(req.user!.id);
  res.append("Set-Cookie", "gazlog_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  res.status(204).end();
});

app.use("/api", api);

// SEO: robots.txt and sitemap.xml built from BASE_URL so the domain is not baked into the image.
const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
// Logged-in app routes: served with 200 but kept out of the sitemap.
const APP_PATHS = /^\/(new|settings|edit\/\d+)$/;
const PUBLIC_PAGES = [
  "/",
  "/guides",
  "/guides/ile-kosztuje-instalacja-lpg-i-kiedy-sie-zwraca",
  "/guides/lpg-czy-benzyna-kalkulator",
  "/guides/jak-liczyc-spalanie-lpg",
  "/privacy",
  "/terms",
];

// Old Polish paths that were live briefly -> permanent redirects.
const LEGACY_REDIRECTS: [RegExp, string][] = [
  [/^\/prywatnosc\/?$/, "/privacy"],
  [/^\/regulamin\/?$/, "/terms"],
  [/^\/poradnik(\/.*)?$/, "/guides$1"],
  [/^\/nowe\/?$/, "/new"],
  [/^\/ustawienia\/?$/, "/settings"],
  [/^\/edytuj\/(\d+)\/?$/, "/edit/$1"],
];
app.use((req, res, next) => {
  for (const [re, to] of LEGACY_REDIRECTS) {
    if (re.test(req.path)) return res.redirect(301, req.path.replace(re, (_m, g1) => to.replace("$1", g1 ?? "")));
  }
  next();
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(
    ["User-agent: *", "Allow: /", "Disallow: /api/", "", `Sitemap: ${BASE_URL}/sitemap.xml`, ""].join("\n")
  );
});

app.get("/sitemap.xml", (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_PAGES.map(
    (p) =>
      `  <url><loc>${BASE_URL}${p}</loc><lastmod>${today}</lastmod><changefreq>${p === "/" ? "weekly" : p.startsWith("/guides") ? "monthly" : "yearly"}</changefreq><priority>${p === "/" ? "1.0" : p.startsWith("/guides") ? "0.7" : "0.3"}</priority></url>`
  );
  res
    .type("application/xml")
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
});

// Serve built client in production. index.html is templated once with the public origin
// (canonical, Open Graph, JSON-LD) and served for every non-API route.
const clientDist = path.resolve(process.cwd(), "../client/dist");
if (fs.existsSync(clientDist)) {
  const indexHtml = fs.readFileSync(path.join(clientDist, "index.html"), "utf8").replaceAll("%GAZLOG_ORIGIN%", BASE_URL);
  app.use(express.static(clientDist, { index: false, maxAge: "1y", immutable: true, setHeaders: (res, filePath) => {
    if (!/\/assets\//.test(filePath)) res.setHeader("Cache-Control", "public, max-age=3600");
  } }));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "not found" });
    const p = req.path.replace(/\/+$/, "") || "/";
    const known = PUBLIC_PAGES.includes(p) || APP_PATHS.test(p);
    res.status(known ? 200 : 404).type("html").setHeader("Cache-Control", "no-cache").send(indexHtml);
  });
}

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`GazLog server on http://localhost:${port}`));
