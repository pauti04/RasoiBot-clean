// Pure recipe helpers — no I/O, no side effects.
// Imported by both server.js and the test suite.

import { uniqueSlug } from "./store.js";

export function isValidRecipe(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.name !== "string" || !obj.name.trim()) return false;
  if (!(typeof obj.servings === "number" && Number.isFinite(obj.servings) && obj.servings > 0)) return false;
  if (!Array.isArray(obj.ingredients) || obj.ingredients.length === 0) return false;
  for (const ing of obj.ingredients) {
    if (!ing || typeof ing !== "object") return false;
    if (typeof ing.name !== "string" || !ing.name.trim()) return false;
    if (ing.quantity !== undefined && ing.quantity !== null &&
        !(typeof ing.quantity === "number" && Number.isFinite(ing.quantity))) return false;
  }
  if (!Array.isArray(obj.steps) || obj.steps.length === 0) return false;
  if (!obj.steps.every((s) => typeof s === "string" && s.trim())) return false;
  return true;
}

export function normalizeRecipe(obj, slugExists) {
  const r = { ...obj };
  if (!r.id || typeof r.id !== "string" || slugExists(r.id)) {
    r.id = uniqueSlug(r.name, slugExists);
  }
  if (!Array.isArray(r.tags)) r.tags = [];
  if (!r.region) r.region = "Indian";
  return r;
}

export function composeAIPrompt(userText) {
  return `
You are RasoiBot — an Indian recipe assistant.
Respond ONLY with valid JSON (no markdown, no extra text).
Return a JSON object with this shape:
{
  "id": "slug-id",
  "name": "Dish name",
  "region": "North Indian | South Indian | East Indian | West Indian | Indo-Chinese",
  "tags": ["vegetarian", "gluten-free"],
  "servings": 2,
  "prep_time_mins": 15,
  "cook_time_mins": 30,
  "ingredients": [
    {"name": "ingredient", "quantity": 1, "unit": "cup"}
  ],
  "steps": ["step1", "step2"],
  "notes": "optional notes"
}

User request: "${userText}"
  `.trim();
}
