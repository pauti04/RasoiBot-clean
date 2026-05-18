// Ingredient ↔ pantry matching.
//
// Previous implementation used bidirectional substring matching, which gave false
// positives: a pantry entry of "ginger" would claim to cover an ingredient of
// "ginger paste" because "ginger paste".includes("ginger") is true.
//
// New rule: tokenize both names, drop cooking descriptors (chopped, fresh, ground,
// quantities, etc.), and consider a match only if the content-word *sets* are equal.
// This is conservative — "red onion" pantry won't cover an "onion" ingredient — but
// it eliminates the false positives. Users can manually mark broader pantry items if
// they want softer matching.

import { normalizeName } from "./store.js";

const STOPWORDS = new Set([
  // preparation / state
  "fresh", "frozen", "dried", "raw", "cooked", "whole", "half", "quarter",
  "chopped", "sliced", "diced", "minced", "grated", "shredded", "crushed",
  "peeled", "cleaned", "washed", "beaten", "stewed", "boiled", "roasted", "toasted",
  "fine", "finely", "coarse", "coarsely", "thinly", "thick", "thickly",
  "small", "medium", "large", "big",
  "ground", "powdered", "ripe", "unripe",
  // descriptors that aren't substantive
  "optional", "or", "and", "to", "taste", "for", "garnish", "of",
  // units occasionally embedded in names
  "tsp", "tbsp", "cup", "cups", "pcs", "piece", "pieces", "g", "kg", "ml", "l",
]);

export function contentTokens(s) {
  return normalizeName(s)
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  for (const t of b) if (!set.has(t)) return false;
  return true;
}

// Is `ingredient` covered by something in `pantryNames`?
export function isCovered(ingredient, pantryNames) {
  const ing = contentTokens(ingredient);
  if (!ing.length) return false;
  for (const pantry of pantryNames) {
    const p = contentTokens(pantry);
    if (!p.length) continue;
    if (sameSet(p, ing)) return true;
  }
  return false;
}

// Convenience: split a recipe's ingredients into { have, missing } given a pantry list.
export function splitByPantry(ingredients, pantryNames) {
  const have = [];
  const missing = [];
  for (const ing of ingredients || []) {
    if (isCovered(ing.name, pantryNames)) have.push(ing);
    else missing.push(ing);
  }
  return { have, missing };
}
