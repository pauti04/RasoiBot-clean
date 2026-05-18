import { Router } from "express";
import { splitByPantry } from "../lib/matching.js";

export function recipesRouter({ recipesStore, pantryStore }) {
  const router = Router();

  function scoreRecipe(r, terms) {
    const hay = (
      r.name + " " +
      (r.region || "") + " " +
      (r.tags || []).join(" ") + " " +
      (r.ingredients || []).map((i) => i.name).join(" ")
    ).toLowerCase();
    let score = 0;
    for (const t of terms) if (hay.includes(t)) score += hay.startsWith(t) ? 3 : 1;
    return score;
  }

  function search(q, { region, diet, limit = 10 } = {}) {
    const text = (q || "").toLowerCase().trim();
    const terms = text.split(/\s+/).filter(Boolean);

    let pool = recipesStore.all();
    if (region) pool = pool.filter((r) => (r.region || "").toLowerCase() === region.toLowerCase());
    if (diet) pool = pool.filter((r) => (r.tags || []).map((t) => t.toLowerCase()).includes(diet.toLowerCase()));

    if (!terms.length) return pool.slice(0, limit);

    return pool
      .map((r) => ({ r, s: scoreRecipe(r, terms) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.r);
  }

  router.get("/", (req, res) => {
    const { q = "", region, diet, limit } = req.query;
    const results = search(q, { region, diet, limit: Math.min(Number(limit) || 10, 25) });
    res.json({ count: results.length, results });
  });

  router.get("/cookable", (req, res) => {
    const raw = req.query.minCoverage;
    const parsed = raw === undefined ? 0.7 : Number(raw);
    const minCoverage = Math.max(0, Math.min(1, Number.isFinite(parsed) ? parsed : 0.7));
    const pantryNames = pantryStore.all().map((p) => p.name);

    const scored = recipesStore.all().map((r) => {
      const ings = r.ingredients || [];
      if (!ings.length) return { recipe: r, coverage: 0, have: 0, total: 0, missing: [] };
      const { have, missing } = splitByPantry(ings, pantryNames);
      return {
        recipe: r,
        coverage: have.length / ings.length,
        have: have.length,
        total: ings.length,
        missing,
      };
    });

    const results = scored
      .filter((x) => x.coverage >= minCoverage)
      .sort((a, b) => b.coverage - a.coverage)
      .slice(0, 15);

    res.json({ count: results.length, results });
  });

  router.get("/:id", (req, res) => {
    const r = recipesStore.findById ? recipesStore.findById(req.params.id) : recipesStore.find((x) => x.id === req.params.id);
    if (!r) return res.status(404).json({ error: "Not found" });
    res.json(r);
  });

  return { router, search };
}
