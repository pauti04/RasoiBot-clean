import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import { api } from "./api.js";
import Discover from "./components/Discover.jsx";
import Pantry from "./components/Pantry.jsx";
import Shopping from "./components/Shopping.jsx";

const VIEWS = [
  { id: "discover", icon: "🍽️", label: "Discover" },
  { id: "pantry",   icon: "🥫", label: "Pantry" },
  { id: "shopping", icon: "🛒", label: "Shopping" },
];

export default function App() {
  const [view, setView] = useState("discover");
  const [pantry, setPantry] = useState([]);
  const [shopping, setShopping] = useState([]);

  const refreshPantry = useCallback(async () => {
    try {
      const data = await api.pantry.list();
      setPantry(data.items || []);
    } catch (err) {
      console.error("pantry refresh failed:", err);
    }
  }, []);

  const refreshShopping = useCallback(async () => {
    try {
      const data = await api.shopping.list();
      setShopping(data.items || []);
    } catch (err) {
      console.error("shopping refresh failed:", err);
    }
  }, []);

  useEffect(() => { refreshPantry(); refreshShopping(); }, [refreshPantry, refreshShopping]);

  const shoppingRemaining = shopping.filter((x) => !x.checked).length;

  function renderMain() {
    if (view === "pantry")   return <Pantry items={pantry} refresh={refreshPantry} />;
    if (view === "shopping") return <Shopping items={shopping} refresh={refreshShopping} />;
    return <Discover pantry={pantry} onShoppingChanged={refreshShopping} />;
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
            >
              <span className="nav__icon">{v.icon}</span>
              <span>{v.label}</span>
              {v.id === "pantry"   && pantry.length   > 0 && <span className="nav__count">{pantry.length}</span>}
              {v.id === "shopping" && shoppingRemaining > 0 && <span className="nav__count">{shoppingRemaining}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar__spacer" />

        <div className="sidebar__footer">
          Tip: tap any recipe to see ingredients with pantry check-marks.
        </div>
      </aside>

      <main className="main">
        <div className="main__inner">{renderMain()}</div>
      </main>

      <nav className="mobile-nav" aria-label="Primary (mobile)">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`mobile-nav__item ${view === v.id ? "mobile-nav__item--active" : ""}`}
            onClick={() => setView(v.id)}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
