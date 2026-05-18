import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5175";

const SUGGESTIONS = [
  "dal tadka for 4",
  "vegan south indian breakfast",
  "quick paneer dish",
  "gluten-free snack",
  "indo-chinese noodles",
];

const REGIONS = ["", "North Indian", "South Indian", "East Indian", "West Indian", "Indo-Chinese"];
const DIETS = ["", "vegan", "vegetarian", "gluten-free"];

function RecipeCard({ recipe }) {
  const {
    name, region, tags = [], servings,
    prep_time_mins, cook_time_mins,
    ingredients = [], steps = [], notes,
  } = recipe;

  const time = (prep_time_mins || 0) + (cook_time_mins || 0);

  return (
    <article className="recipe">
      <div className="recipe__head">
        <h3 className="recipe__title">{name}</h3>
        <div className="recipe__meta">
          {region ? `${region} · ` : ""}
          {servings ? `${servings} servings` : ""}
          {time ? ` · ${time} min` : ""}
        </div>
      </div>
      {tags.length > 0 && (
        <div className="recipe__tags">
          {tags.map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      )}

      <h4 className="recipe__section-title">Ingredients</h4>
      <ul className="recipe__list">
        {ingredients.map((i, idx) => (
          <li key={idx}>
            {i.quantity !== undefined ? `${i.quantity} ` : ""}
            {i.unit ? `${i.unit} ` : ""}
            {i.name}
          </li>
        ))}
      </ul>

      <h4 className="recipe__section-title">Steps</h4>
      <ol className="recipe__list">
        {steps.map((s, idx) => <li key={idx}>{s}</li>)}
      </ol>

      {notes && (
        <>
          <h4 className="recipe__section-title">Notes</h4>
          <p style={{ margin: 0 }}>{notes}</p>
        </>
      )}
    </article>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      kind: "text",
      text: "Hi! I'm RasoiBot 🍲. Ask me for Indian recipes — try a dish, region, or diet.",
    },
  ]);
  const [input, setInput] = useState("");
  const [region, setRegion] = useState("");
  const [diet, setDiet] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function ask(query) {
    const q = (query ?? input).trim();
    if (!q || loading) return;

    setMessages((m) => [...m, { role: "user", kind: "text", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: q, region: region || undefined, diet: diet || undefined }),
      });
      const data = await resp.json();

      if (data?.results?.length > 0) {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            kind: "recipes",
            recipes: data.results,
            source: data.source,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            kind: "text",
            text: data?.note || "Sorry, I couldn't find or generate a recipe for that.",
          },
        ]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "bot", kind: "text", text: "⚠️ Network error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">RasoiBot 🍲</h1>
          <div className="app__subtitle">Indian recipes, on demand</div>
        </div>
      </header>

      <div className="filters" role="region" aria-label="Filters">
        <label>
          Region:&nbsp;
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((r) => <option key={r} value={r}>{r || "Any"}</option>)}
          </select>
        </label>
        <label>
          Diet:&nbsp;
          <select value={diet} onChange={(e) => setDiet(e.target.value)}>
            {DIETS.map((d) => <option key={d} value={d}>{d || "Any"}</option>)}
          </select>
        </label>
      </div>

      <main className="app__main" ref={scrollerRef}>
        <div className="app__main-inner">
          {messages.map((m, i) => {
            if (m.kind === "recipes") {
              return (
                <div className="row row--bot" key={i}>
                  {m.recipes.map((r, j) => <RecipeCard key={r.id || j} recipe={r} />)}
                  {m.source && (
                    <div className="source">
                      {m.source === "ai" ? "✨ Freshly generated" : "📚 From the recipe library"}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div className={`row row--${m.role}`} key={i}>
                <div className={`bubble bubble--${m.role}`}>{m.text}</div>
              </div>
            );
          })}

          {loading && (
            <div className="row row--bot">
              <div className="typing" aria-label="Cooking up a recipe">
                <span /><span /><span />
              </div>
            </div>
          )}

          {messages.length <= 1 && !loading && (
            <div className="suggestions" aria-label="Suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} type="button">{s}</button>
              ))}
            </div>
          )}
        </div>
      </main>

      <form
        className="composer"
        onSubmit={(e) => { e.preventDefault(); ask(); }}
      >
        <div className="composer__inner">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a recipe (e.g., 'dal for 2')…"
            aria-label="Ask for a recipe"
          />
          <button disabled={loading || !input.trim()} type="submit">
            {loading ? "Cooking…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
