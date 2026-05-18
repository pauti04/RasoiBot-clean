import { Router } from "express";
import { uid, normalizeName } from "../lib/store.js";

export function pantryRouter({ pantryStore }) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ items: pantryStore.all() });
  });

  router.post("/", (req, res) => {
    const { name, quantity, unit } = req.body || {};
    if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });

    const norm = normalizeName(name);
    const existing = pantryStore.find((x) => normalizeName(x.name) === norm);
    if (existing) {
      const merged = pantryStore.update(
        (x) => x.id === existing.id,
        {
          name,
          quantity: (Number(existing.quantity) || 0) + (Number(quantity) || 0) || quantity,
          unit: unit || existing.unit,
          updated_at: new Date().toISOString(),
        },
      );
      return res.json({ item: merged, merged: true });
    }

    const item = {
      id: uid(),
      name,
      quantity: quantity ?? null,
      unit: unit || "",
      added_at: new Date().toISOString(),
    };
    pantryStore.push(item);
    res.status(201).json({ item });
  });

  router.patch("/:id", (req, res) => {
    const allowed = ["name", "quantity", "unit"];
    const patch = {};
    for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];
    patch.updated_at = new Date().toISOString();
    const updated = pantryStore.update((x) => x.id === req.params.id, patch);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ item: updated });
  });

  router.delete("/:id", (req, res) => {
    const removed = pantryStore.remove((x) => x.id === req.params.id);
    if (!removed) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  router.delete("/", (_req, res) => {
    pantryStore.replace([]);
    res.json({ ok: true });
  });

  return { router };
}
