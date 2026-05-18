import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api.js";
import { toast } from "../lib/toast.js";
import { useDebounced, useKeyboard } from "../lib/hooks.js";
import RecipeCard from "./RecipeCard.jsx";
import RecipeDetail from "./RecipeDetail.jsx";

const REGIONS = ["", "North Indian", "South Indian", "East Indian", "West Indian", "Indo-Chinese"];
const DIETS = ["", "vegan", "vegetarian", "gluten-free"];

const STARTERS = [
  "dal tadka",
  "south indian breakfast",
  "quick paneer dish",
  "gluten-free snack",
  "indo-chinese noodles",
];

export default function Discover({ hash, setHash, pantry = [], onShoppingChanged }) {
  const [query, setQuery] = useState(hash.q || "");
  const region = hash.region || "";
  const diet = hash.diet || "";
  const [results, setResults] = useState([]);
  const [resultSource, setResultSource] = useState(null);
  const [openId, setOpenId] = useState(hash.recipe || null);
  const [openSource, setOpenSource] = useState(null);
  const [cookable, setCookable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchRef = useRef(null);
  const detailRef = useRef(null);

  const debouncedQuery = useDebounced(query, 300);

  // Live search
  useEffect(() => {
    let cancelled = false;
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      setResultSource(null);
      setLoading(false);
      setHash({ q: undefined });
      return;
    }
    setLoading(true);
    setError(null);
    api.query({ text: q, region: region || undefined, diet: diet || undefined })
      .then((data) => {
        if (cancelled) return;
        setResults((data.results || []).map((r) => ({ ...r, _fromLibrary: data.source === "local" })));
        setResultSource(data.source);
        setHash({ q });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery, region, diet]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Cookable refresh when pantry changes
  useEffect(() => {
    api.recipes.cookable(0.4)
      .then((data) => setCookable(data.results || []))
      .catch(() => setCookable([]));
  }, [pantry.length]);

  // "/" focuses search; Esc closes detail
  useKeyboard({ key: "/" }, (e) => {
    e.preventDefault();
    searchRef.current?.focus();
    searchRef.current?.select?.();
  });
  useKeyboard({ key: "Escape" }, () => {
    if (openId) { setOpenId(null); setHash({ recipe: undefined }); }
  }, { allowInInput: true });

  async function askAI() {
    if (!query.trim() || aiLoading) return;
    setAiLoading(true); setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5175";
      const resp = await fetch(apiBase + "/api/ai-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      const data = await resp.json();
      if (data?.recipe) {
        setResults([{ ...data.recipe, _fromLibrary: false }]);
        setResultSource("ai");
        openRecipe(data.recipe, "ai");
        toast.success(`Generated “${data.recipe.name}”.`);
      } else {
        setError(data?.error || "RasoiBot couldn't come up with one.");
        toast.error(data?.error || "AI couldn't generate a recipe.");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  function openRecipe(r, source) {
    setOpenId(r.id);
    setOpenSource(source);
    setHash({ recipe: r.id });
    queueMicrotask(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  function closeRecipe() {
    setOpenId(null);
    setOpenSource(null);
    setHash({ recipe: undefined });
  }

  function setRegion(r) { setHash({ region: r || undefined }); }
  function setDiet(d)  { setHash({ diet: d || undefined }); }

  const openRecipeObj = useMemo(() => {
    if (!openId) return null;
    return results.find((r) => r.id === openId)
      || cookable.find((c) => c.recipe.id === openId)?.recipe
      || null;
  }, [openId, results, cookable]);

  const showCookable = cookable.length > 0 && !query && !openId;
  const showResults = results.length > 0;
  const showSkeletons = loading && !showResults;
  const showEmpty = query.trim() && !loading && results.length === 0;

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
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <span className="search__icon" aria-hidden="true">🔍</span>
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes — dal, paneer, gluten-free dosa…"
          aria-label="Search recipes"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        {loading
          ? <span className="search__loading" aria-label="Searching" />
          : <kbd className="search__kbd" aria-label="Shortcut">/</kbd>}
      </form>

      <div className="filter-row">
        <span className="filter-row__label">Region</span>
        {REGIONS.map((r) => (
          <button
            key={r || "any-r"}
            type="button"
            className={`pill ${region === r ? "pill--active" : ""}`}
            onClick={() => setRegion(r)}
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
            onClick={() => setDiet(d)}
          >
            {d || "Any"}
          </button>
        ))}
      </div>

      {error && <div className="alert" role="alert">⚠️ {error}</div>}

      {openRecipeObj && (
        <div ref={detailRef}>
          <RecipeDetail
            recipe={openRecipeObj}
            source={openSource}
            pantry={pantry}
            onClose={closeRecipe}
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
            <span className="section__hint">
              {results.length} {results.length === 1 ? "recipe" : "recipes"}
            </span>
          </div>
          <div className="grid">
            {results.map((r, i) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                stagger={i * 40}
                onOpen={() => openRecipe(r, resultSource)}
              />
            ))}
          </div>
        </section>
      )}

      {showSkeletons && (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Searching…</h2>
          </div>
          <div className="grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-line skeleton-line--title" />
                <div className="skeleton skeleton-line skeleton-line--meta" />
                <div className="skeleton skeleton-line skeleton-line--tag" />
              </div>
            ))}
          </div>
        </section>
      )}

      {showEmpty && (
        <div className="empty">
          <div className="empty__hero" aria-hidden="true">🔍</div>
          <div className="empty__title">No matches for “{query}”</div>
          <div>RasoiBot can invent one for you on the spot.</div>
          <div style={{ marginTop: "0.9rem" }}>
            <button
              type="button"
              className="btn btn--accent"
              onClick={askAI}
              disabled={aiLoading}
            >
              {aiLoading ? "Inventing…" : `✨ Invent a “${query}” recipe`}
            </button>
          </div>
        </div>
      )}

      {showCookable && (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">From your pantry</h2>
            <span className="section__hint">
              {cookable.length} {cookable.length === 1 ? "match" : "matches"}
            </span>
          </div>
          <div className="grid">
            {cookable.map(({ recipe, coverage }, i) => (
              <RecipeCard
                key={recipe.id}
                recipe={{ ...recipe, _fromLibrary: true }}
                coverage={coverage}
                stagger={i * 40}
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
            <span className="section__hint">popular starters</span>
          </div>
          <div className="filter-row">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                className="pill"
                onClick={() => { setQuery(s); searchRef.current?.focus(); }}
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
