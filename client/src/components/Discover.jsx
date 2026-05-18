import React, { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import RecipeCard from "./RecipeCard.jsx";
import RecipeDetail from "./RecipeDetail.jsx";

const REGIONS = ["", "North Indian", "South Indian", "East Indian", "West Indian", "Indo-Chinese"];
const DIETS = ["", "vegan", "vegetarian", "gluten-free"];

const SUGGESTIONS = [
  "dal tadka",
  "vegan south indian breakfast",
  "quick paneer dish",
  "gluten-free snack",
  "indo-chinese noodles",
];

export default function Discover({ pantry = [], onShoppingChanged }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [diet, setDiet] = useState("");
  const [results, setResults] = useState([]);
  const [resultSource, setResultSource] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [openSource, setOpenSource] = useState(null);
  const [cookable, setCookable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const detailRef = useRef(null);

  useEffect(() => { refreshCookable(); }, [pantry.length]);

  async function refreshCookable() {
    try {
      const data = await api.recipes.cookable(0.4);
      setCookable(data.results || []);
    } catch {
      setCookable([]);
    }
  }

  async function runSearch(text, opts = {}) {
    const q = (text ?? query).trim();
    setLoading(true); setError(null); setOpenId(null);
    try {
      if (!q) {
        setResults([]); setResultSource(null);
      } else {
        const data = await api.query({ text: q, region: opts.region ?? region, diet: opts.diet ?? diet });
        setResults((data.results || []).map((r) => ({ ...r, _fromLibrary: data.source === "local" })));
        setResultSource(data.source);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function askAI() {
    if (!query.trim() || aiLoading) return;
    setAiLoading(true); setError(null);
    try {
      const data = await fetch(
        (import.meta.env.VITE_API_URL || "http://localhost:5175") + "/api/ai-recipe",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: query }) },
      ).then((r) => r.json());
      if (data?.recipe) {
        setResults([{ ...data.recipe, _fromLibrary: false }]);
        setResultSource("ai");
        setOpenId(data.recipe.id);
        setOpenSource("ai");
      } else {
        setError(data?.error || "RasoiBot couldn't come up with one.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  function openRecipe(r, source) {
    setOpenId(r.id);
    setOpenSource(source);
    queueMicrotask(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const openRecipeObj = openId
    ? results.find((r) => r.id === openId)
      || cookable.find((c) => c.recipe.id === openId)?.recipe
    : null;

  const showCookable = cookable.length > 0 && !query && !openId;
  const showResults = results.length > 0;
  const showEmpty = query && !loading && results.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="page-head">
        <span className="page-head__eyebrow">Discover</span>
        <h1 className="page-head__title">What are we cooking tonight?</h1>
        <p className="page-head__lede">
          Search a dish, pick a region, or let RasoiBot suggest something from
          what's in your pantry.
        </p>
      </div>

      <form
        className="search"
        onSubmit={(e) => { e.preventDefault(); runSearch(); }}
      >
        <span className="search__icon">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="dal tadka, paneer butter masala, gluten-free dosa…"
          aria-label="Search recipes"
        />
        <button type="submit" disabled={loading}>
          {loading ? "…" : "Search"}
        </button>
      </form>

      <div className="filter-row">
        <span className="filter-row__label">Region</span>
        {REGIONS.map((r) => (
          <button
            key={r || "any-r"}
            type="button"
            className={`pill ${region === r ? "pill--active" : ""}`}
            onClick={() => { setRegion(r); if (query) runSearch(query, { region: r }); }}
          >
            {r || "Any"}
          </button>
        ))}
        <span className="filter-row__label" style={{ marginLeft: "0.5rem" }}>Diet</span>
        {DIETS.map((d) => (
          <button
            key={d || "any-d"}
            type="button"
            className={`pill ${diet === d ? "pill--active" : ""}`}
            onClick={() => { setDiet(d); if (query) runSearch(query, { diet: d }); }}
          >
            {d || "Any"}
          </button>
        ))}
      </div>

      {error && <div className="alert">⚠️ {error}</div>}

      {openRecipeObj && (
        <div ref={detailRef}>
          <RecipeDetail
            recipe={openRecipeObj}
            source={openSource}
            pantry={pantry}
            onClose={() => setOpenId(null)}
            onShoppingChanged={onShoppingChanged}
          />
        </div>
      )}

      {showResults && !openId && (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">
              {resultSource === "ai" ? "Freshly invented" : "Search results"}
            </h2>
            <span className="section__hint">{results.length} {results.length === 1 ? "recipe" : "recipes"}</span>
          </div>
          <div className="grid">
            {results.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onOpen={() => openRecipe(r, resultSource)}
              />
            ))}
          </div>
        </section>
      )}

      {showEmpty && (
        <div className="empty">
          <div className="empty__hero">🤔</div>
          <div className="empty__title">Nothing in the library matches “{query}”</div>
          <div>Want RasoiBot to invent one for you?</div>
          <div style={{ marginTop: "0.9rem" }}>
            <button type="button" className="btn btn--accent" onClick={askAI} disabled={aiLoading}>
              {aiLoading ? "Inventing…" : `✨ Invent a “${query}” recipe`}
            </button>
          </div>
        </div>
      )}

      {showCookable && (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">From your pantry</h2>
            <span className="section__hint">{cookable.length} {cookable.length === 1 ? "match" : "matches"}</span>
          </div>
          <div className="grid">
            {cookable.map(({ recipe, coverage }) => (
              <RecipeCard
                key={recipe.id}
                recipe={{ ...recipe, _fromLibrary: true }}
                coverage={coverage}
                onOpen={() => openRecipe(recipe, "local")}
              />
            ))}
          </div>
        </section>
      )}

      {!query && !openId && cookable.length === 0 && (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Try one of these</h2>
          </div>
          <div className="filter-row">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="pill"
                onClick={() => { setQuery(s); runSearch(s); }}
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {aiLoading && (
        <div className="empty">
          <div className="dots"><span /><span /><span /></div>
          <div style={{ marginTop: "0.4rem" }}>Cooking something up…</div>
        </div>
      )}
    </div>
  );
}
