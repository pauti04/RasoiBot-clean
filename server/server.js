// server.js (complete with OpenAI integration)

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
app.use(bodyParser.json());

// ------------------- OpenAI setup -------------------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!OPENAI_API_KEY) {
  console.warn("⚠️ Warning: OPENAI_API_KEY missing in .env");
}
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ------------------- Local recipes -------------------
const RECIPES_PATH = path.join(process.cwd(), "recipes.json");
let RECIPES = [];
try {
  RECIPES = JSON.parse(fs.readFileSync(RECIPES_PATH, "utf8"));
} catch {
  RECIPES = [];
}

// Helper: find local matches
function findRecipesByQuery(q) {
  q = (q || "").toLowerCase().trim();
  if (!q) return RECIPES.slice(0, 10);
  return RECIPES.filter(r =>
    (r.name + " " + (r.tags||[]).join(" ") + " " +
     (r.ingredients||[]).map(i=>i.name).join(" ")).toLowerCase()
     .includes(q)
  );
}

// Helper: validate recipe shape
function isValidRecipe(obj) {
  if (!obj || typeof obj !== "object") return false;
  const must = ["id","name","servings","ingredients","steps"];
  return must.every(k => k in obj) &&
         Array.isArray(obj.ingredients) &&
         Array.isArray(obj.steps);
}

// Prompt for OpenAI
function composePrompt(userText) {
  return `
You are RasoiBot — an Indian recipe assistant. 
Respond ONLY with valid JSON (no markdown, no extra text).
Return a JSON object:
{
  "id": "slug-id",
  "name": "Dish name",
  "region": "North Indian",
  "tags": ["vegetarian"],
  "servings": 2,
  "prep_time_mins": 15,
  "cook_time_mins": 30,
  "ingredients": [
    {"name":"ingredient","quantity":1,"unit":"cup"}
  ],
  "steps": ["step1","step2"],
  "notes": "optional notes"
}

User request: "${userText}"
  `.trim();
}

// ------------------- API endpoints -------------------

// Rate limit AI endpoint
const limiter = rateLimit({ windowMs: 60*1000, max: 10 });
app.use("/api/ai-recipe", limiter);

// Direct AI call
app.post("/api/ai-recipe", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    const resp = await openai.responses.create({
      model: OPENAI_MODEL,
      input: composePrompt(text),
      max_output_tokens: 600
    });

    const raw = resp.output_text || "";
    let cleaned = raw.trim().replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    let parsed = null;

    try { parsed = JSON.parse(cleaned); }
    catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch {}
    }

    if (!isValidRecipe(parsed)) {
      return res.status(502).json({ error: "Invalid recipe", raw: raw.slice(0,300) });
    }

    RECIPES.push(parsed);
    fs.writeFileSync(RECIPES_PATH, JSON.stringify(RECIPES,null,2));

    res.json({ source: "openai", recipe: parsed });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// Search query
app.post("/api/query", async (req, res) => {
  const { text } = req.body;
  const found = findRecipesByQuery(text);
  if (found.length) return res.json({ source:"local", results:found });

  // fallback to AI
  const aiResp = await fetch(`http://127.0.0.1:${process.env.PORT||5175}/api/ai-recipe`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ text })
  });
  const aiJson = await aiResp.json();
  if (aiJson?.recipe) return res.json({ source:"openai", results:[aiJson.recipe] });
  res.json({ source:"none", results:[] });
});

// Get recipe by id
app.get("/api/recipe/:id", (req, res) => {
  const r = RECIPES.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error:"Not found" });
  res.json(r);
});

// ------------------- Start server -------------------
const PORT = process.env.PORT || 5175;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
