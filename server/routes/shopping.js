import { Router } from "express";
import { uid, normalizeName } from "../lib/store.js";

export function shoppingRouter({ shoppingStore, pantryStore, recipesStore }) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ items: shoppingStore.all() });
  });

  router.post("/", (req, res) => {
    const { name, quantity, unit, from_recipe } = req.body || {};
    if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });

    const norm = normalizeName(name);
    const existing = shoppingStore.find((x) => normalizeName(x.name) === norm && !x.checked);
    if (existing) {
      const merged = shoppingStore.update(
        (x) => x.id === existing.id,
        {
          quantity: (Number(existing.quantity) || 0) + (Number(quantity) || 0) || existing.quantity || quantity,
          unit: unit || existing.unit,
          from_recipe: from_recipe || existing.from_recipe,
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

  // Add the missing-from-pantry ingredients of a recipe to the shopping list.
  router.post("/from-recipe", (req, res) => {
    const { recipeId } = req.body || {};
    if (!recipeId) return res.status(400).json({ error: "recipeId required" });

    const recipe = recipesStore.find((r) => r.id === recipeId);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    const pantryNames = pantryStore.all().map((p) => normalizeName(p.name));
    const added = [];
    const skipped = [];

    for (const ing of recipe.ingredients || []) {
      const n = normalizeName(ing.name);
      const inPantry = pantryNames.some((p) => p && (n.includes(p) || p.includes(n)));
      if (inPantry) { skipped.push(ing.name); continue; }

      const existing = shoppingStore.find((x) => normalizeName(x.name) === n && !x.checked);
      if (existing) { skipped.push(ing.name); continue; }

      const item = {
        id: uid(),
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit || "",
        checked: false,
        from_recipe: recipe.id,
        added_at: new Date().toISOString(),
      };
      shoppingStore.push(item);
      added.push(item);
    }

    res.json({ added, skipped, recipe: { id: recipe.id, name: recipe.name } });
  });

  return { router };
}
