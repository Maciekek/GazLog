import express from "express";
import path from "node:path";
import fs from "node:fs";
import { z } from "zod";
import { db, getSettings, saveSettings, type Fillup } from "./db.js";
import { enrich, summary } from "./calc.js";

const app = express();
app.use(express.json());

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

app.get("/api/settings", (_req, res) => res.json(getSettings()));

app.put("/api/settings", (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  saveSettings(parsed.data);
  res.json(getSettings());
});

app.get("/api/fillups", (_req, res) => {
  const s = getSettings();
  const rows = db.prepare("SELECT * FROM fillups ORDER BY date DESC, id DESC").all() as Fillup[];
  const items = rows.map((f) => enrich(f, s));
  res.json({ items, summary: summary(items, s) });
});

app.post("/api/fillups", (req, res) => {
  const parsed = fillupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;
  const info = db
    .prepare(
      "INSERT INTO fillups (date, distance_km, lpg_liters, lpg_price, petrol_price, note) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(d.date, d.distance_km, d.lpg_liters, d.lpg_price, d.petrol_price, d.note ?? null);
  const row = db.prepare("SELECT * FROM fillups WHERE id = ?").get(info.lastInsertRowid) as Fillup;
  res.status(201).json(enrich(row, getSettings()));
});

app.put("/api/fillups/:id", (req, res) => {
  const parsed = fillupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;
  const info = db
    .prepare(
      "UPDATE fillups SET date=?, distance_km=?, lpg_liters=?, lpg_price=?, petrol_price=?, note=? WHERE id=?"
    )
    .run(d.date, d.distance_km, d.lpg_liters, d.lpg_price, d.petrol_price, d.note ?? null, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "not found" });
  const row = db.prepare("SELECT * FROM fillups WHERE id = ?").get(req.params.id) as Fillup;
  res.json(enrich(row, getSettings()));
});

app.delete("/api/fillups/:id", (req, res) => {
  const info = db.prepare("DELETE FROM fillups WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

// Serve built client in production
const clientDist = path.resolve(process.cwd(), "../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`GazLog server on http://localhost:${port}`));
