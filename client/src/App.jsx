import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { api } from "./api.js";
import RecipeCard from "./components/RecipeCard.jsx";
import Pantry from "./components/Pantry.jsx";
import Shopping from "./components/Shopping.jsx";

const SUGGESTIONS = [
  "dal tadka for 4",
  "vegan south indian breakfast",
  "quick paneer dish",
  "gluten-free snack",
  "indo-chinese noodles",
];

const REGIONS = ["", "North Indian", "South Indian", "East Indian", "West Indian", "Indo-Chinese"];
const DIETS = ["", "vegan", "vegetarian", "gluten-free"];

function Chat({ onShoppingChanged }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      kind: "text",
      text: "Hi! I'm RasoiBot 🍲. Ask me for an Indian recipe — or tap “What can I cook?” to use what's in your pantry.",
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
      const data = await api.query({ text: q, region: region || undefined, diet: diet || undefined });
      if (data?.results?.length > 0) {
        setMessages((m) => [...m, { role: "bot", kind: "recipes", recipes: data.results, source: data.source }]);
      } else {
        setMessages((m) => [...m, {
          role: "bot",
          kind: "text",
          text: data?.note || "Sorry, I couldn't find or generate a recipe for that.",
        }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", kind: "text", text: "⚠️ " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  async function cookable() {
    if (loading) return;
    setMessages((m) => [...m, { role: "user", kind: "text", text: "What can I cook with what I have?" }]);
    setLoading(true);
    try {
      const data = await api.recipes.cookable(0.6);
      if (data?.results?.length) {
        setMessages((m) => [...m, {
          role: "bot",
          kind: "cookable",
          results: data.results,
        }]);
      } else {
        setMessages((m) => [...m, {
          role: "bot",
          kind: "text",
          text: "Your pantry doesn't cover enough of any recipe yet. Add a few staples and try again.",
        }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", kind: "text", text: "⚠️ " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
        <button type="button" className="btn btn--ghost filters__action" onClick={cookable} disabled={loading}>
          🍳 What can I cook?
        </button>
      </div>

      <main className="app__main" ref={scrollerRef}>
        <div className="app__main-inner">
          {messages.map((m, i) => {
            if (m.kind === "recipes") {
              return (
                <div className="row row--bot" key={i}>
                  {m.recipes.map((r, j) => (
                    <RecipeCard key={r.id || j} recipe={r} onAdded={onShoppingChanged} />
                  ))}
                  {m.source && (
                    <div className="source">
                      {m.source === "ai" ? "✨ Freshly generated" : "📚 From the recipe library"}
                    </div>
                  )}
                </div>
              );
            }
            if (m.kind === "cookable") {
              return (
                <div className="row row--bot" key={i}>
                  <div className="bubble bubble--bot">
                    Based on your pantry, here are dishes you're close to making:
                  </div>
                  {m.results.map(({ recipe, coverage, missing }, j) => (
                    <div key={recipe.id || j} className="cookable">
                      <div className="cookable__head">
                        <strong>{recipe.name}</strong>
                        <span className="cookable__coverage">{Math.round(coverage * 100)}% covered</span>
                      </div>
                      {missing?.length > 0 && (
                        <div className="cookable__missing">
                          Missing: {missing.map((x) => x.name).join(", ")}
                        </div>
                      )}
                      <RecipeCard recipe={recipe} onAdded={onShoppingChanged} />
                    </div>
                  ))}
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
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState("chat");
  const [shoppingTick, setShoppingTick] = useState(0);

  function bumpShopping() { setShoppingTick((n) => n + 1); }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">RasoiBot 🍲</h1>
          <div className="app__subtitle">Indian recipes · pantry · shopping</div>
        </div>
        <nav className="tabs" aria-label="Sections">
          {[
            { id: "chat", label: "💬 Chat" },
            { id: "pantry", label: "🥫 Pantry" },
            { id: "shopping", label: "🛒 Shopping" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? "tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "chat" && <Chat onShoppingChanged={bumpShopping} />}
      {tab === "pantry" && (
        <main className="app__main">
          <div className="app__main-inner">
            <Pantry />
          </div>
        </main>
      )}
      {tab === "shopping" && (
        <main className="app__main">
          <div className="app__main-inner">
            <Shopping refreshKey={shoppingTick} />
          </div>
        </main>
      )}
    </div>
  );
}
