// RasoiBot server — Express + OpenAI for Indian recipes,
// with pantry + shopping-list storage.

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";

import { createStore, slugify } from "./lib/store.js";
import { recipesRouter } from "./routes/recipes.js";
import { pantryRouter } from "./routes/pantry.js";
import { shoppingRouter } from "./routes/shopping.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "256kb" }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const PORT = process.env.PORT || 5175;

if (!OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY missing — AI fallback disabled until it's set in .env");
}
let _openai = null;
function getOpenAI() {
  if (!OPENAI_API_KEY) return null;
  if (!_openai) _openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  return _openai;
}

const recipesStore = createStore("recipes.json", []);
const pantryStore = createStore("pantry.json", []);
const shoppingStore = createStore("shopping.json", []);

function isValidRecipe(obj) {
  if (!obj || typeof obj !== "object") return false;
  const required = ["name", "servings", "ingredients", "steps"];
  return required.every((k) => k in obj) &&
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
  res.json({
    ok: true,
    recipes: recipesStore.all().length,
    pantry: pantryStore.all().length,
    shopping: shoppingStore.all().length,
    model: OPENAI_MODEL,
  });
});

const { router: recipesApi, search: searchRecipes } = recipesRouter({ recipesStore, pantryStore });
app.use("/api/recipes", recipesApi);
app.use("/api/pantry", pantryRouter({ pantryStore }).router);
app.use("/api/shopping", shoppingRouter({ shoppingStore, pantryStore, recipesStore }).router);

app.post("/api/ai-recipe", aiLimiter, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") return res.status(400).json({ error: "Missing text" });
    const openai = getOpenAI();
    if (!openai) return res.status(503).json({ error: "AI unavailable: OPENAI_API_KEY not set" });

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
    const all = recipesStore.all();
    const dupe = all.find((r) => r.id === recipe.id || r.name.toLowerCase() === recipe.name.toLowerCase());
    if (!dupe) recipesStore.push(recipe);

    res.json({ source: "ai", recipe });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.post("/api/query", async (req, res) => {
  const { text, region, diet } = req.body || {};
  if (!text || typeof text !== "string") return res.status(400).json({ error: "Missing text" });

  const local = searchRecipes(text, { region, diet, limit: 5 });
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

const server = app.listen(PORT, () => console.log(`🚀 RasoiBot server running on http://localhost:${PORT}`));

function shutdown() {
  recipesStore.flushNow();
  pantryStore.flushNow();
  shoppingStore.flushNow();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
