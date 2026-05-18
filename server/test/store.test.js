import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";

import { getDB, closeDB } from "../lib/db.js";
import { createStore, slugify, uniqueSlug, normalizeName, uid } from "../lib/store.js";

function freshDB() {
  closeDB();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rasoibot-test-"));
  process.env.RASOIBOT_DATA_DIR = dir;
  getDB();
}

beforeEach(freshDB);

test("createStore — push / find / all / findById round-trip", () => {
  const store = createStore("pantry");
  const a = store.push({ id: "a", name: "toor dal" });
  const b = store.push({ id: "b", name: "turmeric" });
  assert.equal(store.all().length, 2);
  assert.equal(store.find((x) => x.name === "turmeric").id, b.id);
  assert.equal(store.findById("a").name, "toor dal");
  assert.equal(store.findById("missing"), undefined);
});

test("createStore — update merges patch and persists", () => {
  const store = createStore("pantry");
  store.push({ id: "x", name: "toor dal", quantity: 1 });
  const updated = store.update((x) => x.id === "x", { quantity: 3 });
  assert.equal(updated.quantity, 3);
  assert.equal(updated.name, "toor dal");
  assert.equal(store.findById("x").quantity, 3);
});

test("createStore — update on missing returns null", () => {
  const store = createStore("pantry");
  assert.equal(store.update((x) => x.id === "nope", { quantity: 9 }), null);
});

test("createStore — remove deletes matching rows and returns count", () => {
  const store = createStore("shopping");
  store.push({ id: "1", name: "ginger", checked: true });
  store.push({ id: "2", name: "garlic", checked: false });
  store.push({ id: "3", name: "salt", checked: true });
  const removed = store.remove((x) => x.checked);
  assert.equal(removed, 2);
  const remaining = store.all();
  assert.deepEqual(remaining.map((x) => x.id), ["2"]);
});

test("createStore — replace wipes and re-inserts", () => {
  const store = createStore("recipes");
  store.push({ id: "old", name: "Old" });
  store.replace([{ id: "new1", name: "New 1" }, { id: "new2", name: "New 2" }]);
  assert.deepEqual(store.all().map((x) => x.id).sort(), ["new1", "new2"]);
});

test("createStore — push requires an id", () => {
  const store = createStore("pantry");
  assert.throws(() => store.push({ name: "no id here" }), /must have an id/);
});

test("slugify — lowercases, replaces non-alphanumerics, trims", () => {
  assert.equal(slugify("Dal Tadka"), "dal-tadka");
  assert.equal(slugify("  Aloo Gobi!! "), "aloo-gobi");
  assert.equal(slugify("North-Indian / Punjabi"), "north-indian-punjabi");
  assert.equal(slugify(""), "");
});

test("uniqueSlug — returns base when free, appends -2, -3 when taken", () => {
  const taken = new Set(["dal-tadka", "dal-tadka-2"]);
  const exists = (s) => taken.has(s);
  assert.equal(uniqueSlug("Aloo Gobi", exists), "aloo-gobi");
  assert.equal(uniqueSlug("Dal Tadka", exists), "dal-tadka-3");
});

test("normalizeName — strips parens, punctuation, collapses whitespace", () => {
  assert.equal(normalizeName("Onion (finely chopped)"), "onion");
  assert.equal(normalizeName("  Toor Dal  "), "toor dal");
  assert.equal(normalizeName("Salt, to taste!"), "salt to taste");
});

test("uid — returns a non-empty string and changes each call", () => {
  const a = uid(), b = uid();
  assert.equal(typeof a, "string");
  assert.ok(a.length > 4);
  assert.notEqual(a, b);
});
