import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Pantry({ items, refresh }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => { setError(null); }, [items]);

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.pantry.add({
        name: name.trim(),
        quantity: quantity ? Number(quantity) : null,
        unit: unit.trim() || undefined,
      });
      setName(""); setQuantity(""); setUnit("");
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(id) {
    try {
      await api.pantry.remove(id);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-head">
        <span className="page-head__eyebrow">Your pantry</span>
        <h1 className="page-head__title">What's in your kitchen</h1>
        <p className="page-head__lede">
          Add what you've got at home. RasoiBot uses this to skip items you don't
          need to buy and to suggest recipes you can already cook.
        </p>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">Ingredients</h2>
          <span className="panel__count">{items.length} {items.length === 1 ? "item" : "items"}</span>
        </div>

        <form className="add-form" onSubmit={add}>
          <input
            placeholder="e.g., toor dal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Ingredient name"
          />
          <input
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="decimal"
            aria-label="Quantity"
          />
          <input
            placeholder="Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            aria-label="Unit"
          />
          <button className="btn btn--brand" type="submit" disabled={!name.trim()}>
            Add
          </button>
        </form>

        {error && <div className="alert">⚠️ {error}</div>}

        {items.length === 0 ? (
          <div className="empty">
            <div className="empty__hero">🥫</div>
            <div className="empty__title">Pantry is empty</div>
            <div>Add a few staples so RasoiBot can suggest recipes you can already cook.</div>
          </div>
        ) : (
          <ul className="list">
            {items.map((it) => (
              <li key={it.id} className="list__row">
                <div className="list__main">
                  <div className="list__name">{it.name}</div>
                  {(it.quantity || it.unit) && (
                    <div className="list__meta">
                      {it.quantity ?? ""} {it.unit || ""}
                    </div>
                  )}
                </div>
                <button type="button" className="icon-btn" onClick={() => remove(it.id)} aria-label={`Remove ${it.name}`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
