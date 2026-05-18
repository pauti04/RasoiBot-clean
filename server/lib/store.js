// Collection store backed by SQLite (via lib/db.js). The shape of the API is the
// same as the previous JSON-file store, so routes don't change.

import { getDB } from "./db.js";

export function createStore(tableName) {
  const db = getDB();
  const selectAll  = db.prepare(`SELECT data FROM ${tableName}`);
  const selectById = db.prepare(`SELECT data FROM ${tableName} WHERE id = ?`);
  const insertRow  = db.prepare(`INSERT OR REPLACE INTO ${tableName} (id, data) VALUES (?, ?)`);
  const deleteById = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
  const deleteAll  = db.prepare(`DELETE FROM ${tableName}`);

  function readAll() {
    return selectAll.all().map((r) => JSON.parse(r.data));
  }

  function findOne(pred) {
    for (const r of selectAll.iterate()) {
      const obj = JSON.parse(r.data);
      if (pred(obj)) return obj;
    }
    return undefined;
  }

  function pushOne(item) {
    if (!item || !item.id) throw new Error("createStore: pushed item must have an id");
    insertRow.run(item.id, JSON.stringify(item));
    return item;
  }

  function removeMany(pred) {
    const all = readAll();
    const toDelete = all.filter(pred);
    if (toDelete.length === 0) return 0;
    const tx = db.transaction(() => {
      for (const item of toDelete) deleteById.run(item.id);
    });
    tx();
    return toDelete.length;
  }

  function updateOne(pred, patch) {
    const target = findOne(pred);
    if (!target) return null;
    const merged = { ...target, ...patch };
    insertRow.run(merged.id, JSON.stringify(merged));
    return merged;
  }

  function replaceAll(next) {
    const tx = db.transaction(() => {
      deleteAll.run();
      for (const item of next) {
        if (!item || !item.id) continue;
        insertRow.run(item.id, JSON.stringify(item));
      }
    });
    tx();
    return readAll();
  }

  return {
    all: readAll,
    find: findOne,
    findById: (id) => {
      const row = selectById.get(id);
      return row ? JSON.parse(row.data) : undefined;
    },
    push: pushOne,
    remove: removeMany,
    update: updateOne,
    replace: replaceAll,
    flushNow: () => {},
  };
}

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

export function uniqueSlug(base, exists) {
  const root = slugify(base) || "recipe";
  if (!exists(root)) return root;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${root}-${n}`;
    if (!exists(candidate)) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export function normalizeName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
