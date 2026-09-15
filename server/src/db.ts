import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR ?? path.resolve(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "gazlog.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_sub TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    picture TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
  );

  CREATE TABLE IF NOT EXISTS fillups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    distance_km REAL NOT NULL,
    lpg_liters REAL NOT NULL,
    lpg_price REAL NOT NULL,
    petrol_price REAL NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS fillups_user_date ON fillups(user_id, date DESC, id DESC);
`);

// Migration from pre-auth schema: fillups without user_id column.
const cols = (db.prepare("PRAGMA table_info(fillups)").all() as { name: string }[]).map((c) => c.name);
if (!cols.includes("user_id")) {
  db.exec(`
    ALTER TABLE fillups RENAME TO fillups_old;
    CREATE TABLE fillups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      distance_km REAL NOT NULL,
      lpg_liters REAL NOT NULL,
      lpg_price REAL NOT NULL,
      petrol_price REAL NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS fillups_user_date ON fillups(user_id, date DESC, id DESC);
  `);
  // Old rows are kept in fillups_old; they will be attached to the first user who logs in.
}

export type User = { id: number; google_sub: string; email: string; name: string | null; picture: string | null };

export function upsertUser(u: { sub: string; email: string; name?: string; picture?: string }): User {
  db.prepare(
    `INSERT INTO users (google_sub, email, name, picture) VALUES (?, ?, ?, ?)
     ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture`
  ).run(u.sub, u.email, u.name ?? null, u.picture ?? null);
  const user = db.prepare("SELECT * FROM users WHERE google_sub = ?").get(u.sub) as User;
  adoptLegacyRows(user.id);
  return user;
}

function adoptLegacyRows(userId: number) {
  const hasOld = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='fillups_old'").get();
  if (!hasOld) return;
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO fillups (user_id, date, distance_km, lpg_liters, lpg_price, petrol_price, note, created_at)
       SELECT ?, date, distance_km, lpg_liters, lpg_price, petrol_price, note, created_at FROM fillups_old`
    ).run(userId);
    const hasOldSettings = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get();
    if (hasOldSettings) {
      db.prepare(`INSERT OR IGNORE INTO user_settings (user_id, key, value) SELECT ?, key, value FROM settings`).run(userId);
      db.exec("DROP TABLE settings");
    }
    db.exec("DROP TABLE fillups_old");
  });
  tx();
}

export function createSession(userId: number, token: string, days = 30) {
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', ?))").run(
    token,
    userId,
    `+${days} days`
  );
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

export function getUserBySession(token: string): User | undefined {
  return db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    )
    .get(token) as User | undefined;
}

export function deleteSession(token: string) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export type Settings = {
  petrolConsumption: number; // l/100km on petrol
  installCost: number; // PLN
};

const defaults: Settings = { petrolConsumption: 8, installCost: 0 };

export function getSettings(userId: number): Settings {
  const rows = db.prepare("SELECT key, value FROM user_settings WHERE user_id = ?").all(userId) as {
    key: string;
    value: string;
  }[];
  const out: Settings = { ...defaults };
  for (const r of rows) {
    if (r.key in out) (out as any)[r.key] = Number(r.value);
  }
  return out;
}

export function saveSettings(userId: number, s: Settings) {
  const stmt = db.prepare(
    "INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value"
  );
  const tx = db.transaction(() => {
    for (const [k, v] of Object.entries(s)) stmt.run(userId, k, String(v));
  });
  tx();
}

export type Fillup = {
  id: number;
  user_id: number;
  date: string;
  distance_km: number;
  lpg_liters: number;
  lpg_price: number;
  petrol_price: number;
  note: string | null;
};
