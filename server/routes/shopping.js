import { Router } from "express";
import { uid, normalizeName } from "../lib/store.js";
import { isCovered } from "../lib/matching.js";

export function shoppingRouter({ shoppingStore, pantryStore, recipesStore }) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ items: shoppingStore.all() });
  });

  router.post("/", (req, res) => {
    const { name, quantity, unit, from_recipe, from_recipe_name } = req.body || {};
    if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });

    const norm = normalizeName(name);
    const existing = shoppingStore.find((x) => normalizeName(x.name) === norm && !x.checked);
    if (existing) {
      const mergedQty = (Number(existing.quantity) || 0) + (Number(quantity) || 0);
      const merged = shoppingStore.update(
        (x) => x.id === existing.id,
        {
          quantity: mergedQty || existing.quantity || quantity,
          unit: unit || existing.unit,
          from_recipe: from_recipe || existing.from_recipe,
          from_recipe_name: from_recipe_name || existing.from_recipe_name,
        },
      );
      return res.json({ item: merged, merged: true });
    }

    const item = {
      id: uid(),
      name,
      quantity: quantity ?? null,
      unit: unit || "",
      checked: false,
      from_recipe: from_recipe || null,
      from_recipe_name: from_recipe_name || null,
      added_at: new Date().toISOString(),
    };
    shoppingStore.push(item);
    res.status(201).json({ item });
  });

  router.patch("/:id", (req, res) => {
    const allowed = ["name", "quantity", "unit", "checked"];
    const patch = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];
    const updated = shoppingStore.update((x) => x.id === req.params.id, patch);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ item: updated });
  });

  router.delete("/:id", (req, res) => {
    const removed = shoppingStore.remove((x) => x.id === req.params.id);
    if (!removed) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  router.post("/clear-checked", (_req, res) => {
    const removed = shoppingStore.remove((x) => x.checked);
    res.json({ removed });
  });

  router.post("/from-recipe", (req, res) => {
    const { recipeId } = req.body || {};
    if (!recipeId) return res.status(400).json({ error: "recipeId required" });

    const recipe = recipesStore.findById
      ? recipesStore.findById(recipeId)
      : recipesStore.find((r) => r.id === recipeId);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    const pantryNames = pantryStore.all().map((p) => p.name);
    const added = [];
    const skipped = [];

    for (const ing of recipe.ingredients || []) {
      if (isCovered(ing.name, pantryNames)) { skipped.push(ing.name); continue; }

      const norm = normalizeName(ing.name);
      const existing = shoppingStore.find((x) => normalizeName(x.name) === norm && !x.checked);
      if (existing) { skipped.push(ing.name); continue; }

      const item = {
        id: uid(),
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit || "",
        checked: false,
        from_recipe: recipe.id,
        from_recipe_name: recipe.name,
        added_at: new Date().toISOString(),
      };
      shoppingStore.push(item);
      added.push(item);
    }

    res.json({ added, skipped, recipe: { id: recipe.id, name: recipe.name } });
  });

  return { router };
}
