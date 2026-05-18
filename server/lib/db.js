// SQLite connection + table init.
//
// We use a generic JSON-blob schema: each table has (id TEXT PRIMARY KEY, data TEXT).
// The data column stores the JSON-serialized row.
//
// Trade-off: we lose indexed queries on inner fields, but our data fits comfortably in
// memory (hundreds of recipes, dozens of pantry/shopping items) so a full scan is fine.
// If a column ever needs indexing, hoist it to its own column in the schema below.

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let _db = null;

export function getDB() {
  if (_db) return _db;

  const dataDir = process.env.RASOIBOT_DATA_DIR || path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "rasoibot.db");
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS recipes  (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS pantry   (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS shopping (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  `);

  return _db;
}

export function closeDB() {
  if (_db) {
    _db.close();
    _db = null;
  }
}

// One-time seed from legacy JSON files if a table is empty. Safe to call on every boot.
export function seedFromJSON(tableName, jsonFilename) {
  const db = getDB();
  const count = db.prepare(`SELECT COUNT(*) AS n FROM ${tableName}`).get().n;
  if (count > 0) return { seeded: 0, source: null };

  const jsonPath = path.join(process.cwd(), jsonFilename);
  if (!fs.existsSync(jsonPath)) return { seeded: 0, source: null };

  let rows;
  try {
    rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch {
    return { seeded: 0, source: jsonPath, error: "parse" };
  }
  if (!Array.isArray(rows) || rows.length === 0) return { seeded: 0, source: jsonPath };

  const insert = db.prepare(`INSERT OR REPLACE INTO ${tableName} (id, data) VALUES (?, ?)`);
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      if (!item || !item.id) continue;
      insert.run(item.id, JSON.stringify(item));
    }
  });
  insertMany(rows);

  return { seeded: rows.length, source: jsonPath };
}
