// RasoiBot server — Express + OpenAI for Indian recipes.

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "256kb" }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const PORT = process.env.PORT || 5175;

if (!OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY missing — AI fallback will fail until it's set in .env");
}
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const RECIPES_PATH = path.join(process.cwd(), "recipes.json");
let RECIPES = [];
try {
  RECIPES = JSON.parse(fs.readFileSync(RECIPES_PATH, "utf8"));
} catch {
  RECIPES = [];
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

function saveRecipes() {
  fs.writeFileSync(RECIPES_PATH, JSON.stringify(RECIPES, null, 2));
}

function scoreRecipe(r, terms) {
  const hay = (
    r.name + " " +
    (r.region || "") + " " +
    (r.tags || []).join(" ") + " " +
    (r.ingredients || []).map(i => i.name).join(" ")
  ).toLowerCase();
  let score = 0;
  for (const t of terms) if (hay.includes(t)) score += hay.startsWith(t) ? 3 : 1;
  return score;
}

function findRecipesByQuery(q, { region, diet, limit = 10 } = {}) {
  const text = (q || "").toLowerCase().trim();
  const terms = text.split(/\s+/).filter(Boolean);

  let pool = RECIPES;
  if (region) pool = pool.filter(r => (r.region || "").toLowerCase() === region.toLowerCase());
  if (diet) pool = pool.filter(r => (r.tags || []).map(t => t.toLowerCase()).includes(diet.toLowerCase()));

  if (!terms.length) return pool.slice(0, limit);

  return pool
    .map(r => ({ r, s: scoreRecipe(r, terms) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.r);
}

function isValidRecipe(obj) {
  if (!obj || typeof obj !== "object") return false;
  const required = ["name", "servings", "ingredients", "steps"];
  return required.every(k => k in obj) &&
         Array.isArray(obj.ingredients) && obj.ingredients.length > 0 &&
         Array.isArray(obj.steps) && obj.steps.length > 0;
}

function normalizeRecipe(obj) {
  const r = { ...obj };
  if (!r.id || typeof r.id !== "string") r.id = slugify(r.name);
  if (!Array.isArray(r.tags)) r.tags = [];
  if (!r.region) r.region = "Indian";
  return r;
}

function composePrompt(userText) {
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

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, recipes: RECIPES.length, model: OPENAI_MODEL });
});

app.get("/api/recipes", (req, res) => {
  const { q = "", region, diet, limit } = req.query;
  const results = findRecipesByQuery(q, {
    region,
    diet,
    limit: Math.min(Number(limit) || 10, 25),
  });
  res.json({ count: results.length, results });
});

app.get("/api/recipe/:id", (req, res) => {
  const r = RECIPES.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  res.json(r);
});

app.post("/api/ai-recipe", aiLimiter, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }
    if (!OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI unavailable: OPENAI_API_KEY not set" });
    }

    const resp = await openai.responses.create({
      model: OPENAI_MODEL,
      input: composePrompt(text),
      max_output_tokens: 800,
    });

    const raw = resp.output_text || "";
    const cleaned = raw.trim().replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    let parsed = null;
    try { parsed = JSON.parse(cleaned); }
    catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch {}
    }

    if (!isValidRecipe(parsed)) {
      return res.status(502).json({ error: "Invalid recipe from AI", raw: raw.slice(0, 300) });
    }

    const recipe = normalizeRecipe(parsed);

    const dupe = RECIPES.find(r => r.id === recipe.id || r.name.toLowerCase() === recipe.name.toLowerCase());
    if (!dupe) {
      RECIPES.push(recipe);
      saveRecipes();
    }

    res.json({ source: "ai", recipe });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.post("/api/query", async (req, res) => {
  const { text, region, diet } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing text" });
  }

  const local = findRecipesByQuery(text, { region, diet, limit: 5 });
  if (local.length) return res.json({ source: "local", results: local });

  if (!OPENAI_API_KEY) {
    return res.json({ source: "none", results: [], note: "No local match and AI not configured." });
  }

  try {
    const aiResp = await fetch(`http://127.0.0.1:${PORT}/api/ai-recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const aiJson = await aiResp.json();
    if (aiJson?.recipe) return res.json({ source: "ai", results: [aiJson.recipe] });
    return res.json({ source: "none", results: [] });
  } catch (err) {
    console.error("query AI fallback error:", err);
    return res.status(500).json({ error: "Lookup failed" });
  }
});

app.listen(PORT, () => console.log(`🚀 RasoiBot server running on http://localhost:${PORT}`));
