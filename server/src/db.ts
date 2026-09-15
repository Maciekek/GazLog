import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR ?? path.resolve(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "gazlog.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fillups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    distance_km REAL NOT NULL,
    lpg_liters REAL NOT NULL,
    lpg_price REAL NOT NULL,
    petrol_price REAL NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export type Settings = {
  petrolConsumption: number; // l/100km on petrol
  installCost: number; // PLN
};

const defaults: Settings = { petrolConsumption: 8, installCost: 0 };

export function getSettings(): Settings {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const out: Settings = { ...defaults };
  for (const r of rows) {
    if (r.key in out) (out as any)[r.key] = Number(r.value);
  }
  return out;
}

export function saveSettings(s: Settings) {
  const stmt = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  const tx = db.transaction(() => {
    for (const [k, v] of Object.entries(s)) stmt.run(k, String(v));
  });
  tx();
}

export type Fillup = {
  id: number;
  date: string;
  distance_km: number;
  lpg_liters: number;
  lpg_price: number;
  petrol_price: number;
  note: string | null;
};
