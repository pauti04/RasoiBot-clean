import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import { api } from "./api.js";
import Discover from "./components/Discover.jsx";
import Pantry from "./components/Pantry.jsx";
import Shopping from "./components/Shopping.jsx";
import Toaster from "./components/Toaster.jsx";
import { toast } from "./lib/toast.js";
import { useHashState, useKeyboard } from "./lib/hooks.js";

const VIEWS = [
  { id: "discover", icon: "🍽️", label: "Discover" },
  { id: "pantry",   icon: "🥫", label: "Pantry" },
  { id: "shopping", icon: "🛒", label: "Shopping" },
];
const KNOWN_VIEWS = new Set(VIEWS.map((v) => v.id));

export default function App() {
  const [hash, setHash] = useHashState();
  const view = KNOWN_VIEWS.has(hash.view) ? hash.view : "discover";
  const setView = (id) => setHash({ view: id });

  const [pantry, setPantry] = useState([]);
  const [shopping, setShopping] = useState([]);

  const refreshPantry = useCallback(async () => {
    try {
      const data = await api.pantry.list();
      setPantry(data.items || []);
    } catch (err) {
      console.error("pantry refresh failed:", err);
      toast.error("Couldn't load your pantry. Is the server running?");
    }
  }, []);

  const refreshShopping = useCallback(async () => {
    try {
      const data = await api.shopping.list();
      setShopping(data.items || []);
    } catch (err) {
      console.error("shopping refresh failed:", err);
      toast.error("Couldn't load your shopping list.");
    }
  }, []);

  useEffect(() => { refreshPantry(); refreshShopping(); }, [refreshPantry, refreshShopping]);

  useKeyboard({ key: "1", alt: true }, () => setView("discover"));
  useKeyboard({ key: "2", alt: true }, () => setView("pantry"));
  useKeyboard({ key: "3", alt: true }, () => setView("shopping"));

  const shoppingRemaining = shopping.filter((x) => !x.checked).length;

  function renderMain() {
    if (view === "pantry")   return <Pantry items={pantry} setItems={setPantry} refresh={refreshPantry} />;
    if (view === "shopping") return <Shopping items={shopping} setItems={setShopping} refresh={refreshShopping} />;
    return (
      <Discover
        hash={hash}
        setHash={setHash}
        pantry={pantry}
        onShoppingChanged={refreshShopping}
      />
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark">🍲</span>
          <div>
            <div className="brand__name">RasoiBot</div>
            <div className="brand__sub">your kitchen</div>
          </div>
        </div>

        <nav className="nav" aria-label="Primary">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`nav__item ${view === v.id ? "nav__item--active" : ""}`}
              onClick={() => setView(v.id)}
              aria-current={view === v.id ? "page" : undefined}
            >
              <span className="nav__icon" aria-hidden="true">{v.icon}</span>
              <span>{v.label}</span>
              {v.id === "pantry"   && pantry.length   > 0 && <span className="nav__count">{pantry.length}</span>}
              {v.id === "shopping" && shoppingRemaining > 0 && <span className="nav__count">{shoppingRemaining}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar__spacer" />

        <div className="kbd-hint">
          <span className="kbd">/</span>
          <span>focus search</span>
        </div>
        <div className="kbd-hint">
          <span className="kbd">Esc</span>
          <span>close recipe</span>
        </div>
      </aside>

      <main className="main" key={view}>
        <div className="main__inner">{renderMain()}</div>
      </main>

      <nav className="mobile-nav" aria-label="Primary (mobile)">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`mobile-nav__item ${view === v.id ? "mobile-nav__item--active" : ""}`}
            onClick={() => setView(v.id)}
            aria-current={view === v.id ? "page" : undefined}
          >
            <span aria-hidden="true">{v.icon}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </nav>

      <Toaster />
    </div>
  );
}
