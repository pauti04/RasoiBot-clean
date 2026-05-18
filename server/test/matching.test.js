import { test } from "node:test";
import assert from "node:assert/strict";

import { contentTokens, isCovered, splitByPantry } from "../lib/matching.js";

test("contentTokens — strips descriptors and units", () => {
  assert.deepEqual(contentTokens("Finely chopped onion (medium)"), ["onion"]);
  assert.deepEqual(contentTokens("2 tsp turmeric"), ["turmeric"]);
  assert.deepEqual(contentTokens("Fresh ginger, peeled"), ["ginger"]);
  assert.deepEqual(contentTokens("toor dal"), ["toor", "dal"]);
});

test("isCovered — exact-name pantry covers descriptor-laden ingredient", () => {
  assert.equal(isCovered("onion (finely chopped)", ["onion"]), true);
  assert.equal(isCovered("ginger (sliced)", ["ginger"]), true);
  assert.equal(isCovered("garlic cloves", ["garlic"]), false, "cloves is a substantive token");
});

test("isCovered — 'ginger' pantry does NOT cover 'ginger paste' ingredient", () => {
  // Previously: substring match → false positive
  assert.equal(isCovered("ginger paste", ["ginger"]), false);
  assert.equal(isCovered("tomato paste", ["tomato"]), false);
  assert.equal(isCovered("garlic powder", ["garlic"]), false);
});

test("isCovered — multi-word names match in either token order", () => {
  assert.equal(isCovered("toor dal", ["dal toor"]), true);
  assert.equal(isCovered("red chili powder", ["red chili powder"]), true);
});

test("isCovered — empty / nonsense inputs are not covered", () => {
  assert.equal(isCovered("", ["onion"]), false);
  assert.equal(isCovered("onion", []), false);
  assert.equal(isCovered("onion", [""]), false);
  assert.equal(isCovered("   ", ["onion"]), false);
});

test("splitByPantry — partitions ingredients correctly", () => {
  const ingredients = [
    { name: "toor dal", quantity: 1, unit: "cup" },
    { name: "turmeric", quantity: 0.5, unit: "tsp" },
    { name: "ginger paste", quantity: 1, unit: "tsp" },
    { name: "salt", quantity: 1, unit: "tsp" },
  ];
  const pantry = ["toor dal", "turmeric", "ginger"];
  const { have, missing } = splitByPantry(ingredients, pantry);
  assert.deepEqual(have.map((i) => i.name), ["toor dal", "turmeric"]);
  assert.deepEqual(missing.map((i) => i.name), ["ginger paste", "salt"]);
});
