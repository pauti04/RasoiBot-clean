// Tiny JSON-file store. Atomic writes, in-memory cache, debounced flush.

import fs from "fs";
import path from "path";

export function createStore(filename, fallback = []) {
  const filePath = path.join(process.cwd(), filename);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    data = fallback;
  }

  let pending = null;
  function flush() {
    pending = null;
    const tmp = filePath + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, filePath);
  }
  function save() {
    if (pending) return;
    pending = setTimeout(flush, 150);
  }

  return {
    all: () => data,
    replace: (next) => { data = next; save(); return data; },
    find: (pred) => data.find(pred),
    push: (item) => { data.push(item); save(); return item; },
    remove: (pred) => {
      const before = data.length;
      data = data.filter((x) => !pred(x));
      if (data.length !== before) save();
      return before - data.length;
    },
    update: (pred, patch) => {
      const idx = data.findIndex(pred);
      if (idx === -1) return null;
      data[idx] = { ...data[idx], ...patch };
      save();
      return data[idx];
    },
    flushNow: () => { if (pending) { clearTimeout(pending); flush(); } },
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
