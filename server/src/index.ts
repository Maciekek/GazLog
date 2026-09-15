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

app.use("/api", api);

// Serve built client in production
const clientDist = path.resolve(process.cwd(), "../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`GazLog server on http://localhost:${port}`));
