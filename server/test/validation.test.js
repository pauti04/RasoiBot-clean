import { test } from "node:test";
import assert from "node:assert/strict";

import { isValidRecipe, normalizeRecipe } from "../lib/recipe.js";

const valid = {
  id: "dal-tadka",
  name: "Dal Tadka",
  servings: 4,
  ingredients: [{ name: "toor dal", quantity: 1, unit: "cup" }],
  steps: ["Rinse dal", "Cook"],
};

test("isValidRecipe — accepts a minimal valid recipe", () => {
  assert.equal(isValidRecipe(valid), true);
});

test("isValidRecipe — rejects missing or empty name", () => {
  assert.equal(isValidRecipe({ ...valid, name: "" }), false);
  assert.equal(isValidRecipe({ ...valid, name: undefined }), false);
  assert.equal(isValidRecipe({ ...valid, name: 42 }), false);
});

test("isValidRecipe — rejects non-positive or non-numeric servings", () => {
  assert.equal(isValidRecipe({ ...valid, servings: 0 }), false);
  assert.equal(isValidRecipe({ ...valid, servings: -1 }), false);
  assert.equal(isValidRecipe({ ...valid, servings: "two" }), false);
});

test("isValidRecipe — rejects empty or non-array ingredients", () => {
  assert.equal(isValidRecipe({ ...valid, ingredients: [] }), false);
  assert.equal(isValidRecipe({ ...valid, ingredients: "rice" }), false);
});

test("isValidRecipe — rejects ingredient with non-numeric quantity", () => {
  assert.equal(
    isValidRecipe({ ...valid, ingredients: [{ name: "salt", quantity: "a pinch" }] }),
    false,
  );
});

test("isValidRecipe — accepts ingredient with null/missing quantity", () => {
  assert.equal(
    isValidRecipe({ ...valid, ingredients: [{ name: "salt", quantity: null }] }),
    true,
  );
  assert.equal(
    isValidRecipe({ ...valid, ingredients: [{ name: "salt" }] }),
    true,
  );
});

test("isValidRecipe — rejects empty or non-string steps", () => {
  assert.equal(isValidRecipe({ ...valid, steps: [] }), false);
  assert.equal(isValidRecipe({ ...valid, steps: ["step 1", 2] }), false);
  assert.equal(isValidRecipe({ ...valid, steps: ["step 1", ""] }), false);
});

test("isValidRecipe — rejects null / non-object input", () => {
  assert.equal(isValidRecipe(null), false);
  assert.equal(isValidRecipe(undefined), false);
  assert.equal(isValidRecipe("string"), false);
  assert.equal(isValidRecipe(42), false);
});

test("normalizeRecipe — preserves a free, valid slug", () => {
  const r = normalizeRecipe({ ...valid, id: "dal-tadka" }, () => false);
  assert.equal(r.id, "dal-tadka");
});

test("normalizeRecipe — assigns a unique slug when id collides", () => {
  const taken = new Set(["dal-tadka", "dal-tadka-2"]);
  const r = normalizeRecipe(
    { ...valid, id: "dal-tadka" },
    (slug) => taken.has(slug),
  );
  assert.equal(r.id, "dal-tadka-3");
});

test("normalizeRecipe — defaults region and tags", () => {
  const r = normalizeRecipe({ ...valid, id: undefined, region: undefined, tags: undefined }, () => false);
  assert.equal(r.region, "Indian");
  assert.deepEqual(r.tags, []);
});
