import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Pantry() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.pantry.list();
      setItems(data.items || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

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
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <h2 className="panel__title">Pantry</h2>
        <span className="panel__count">{items.length} {items.length === 1 ? "item" : "items"}</span>
      </header>

      <form className="panel__form" onSubmit={add}>
        <input
          placeholder="Ingredient (e.g., toor dal)"
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
          style={{ width: "5rem" }}
        />
        <input
          placeholder="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          aria-label="Unit"
          style={{ width: "5rem" }}
        />
        <button type="submit" disabled={!name.trim()}>Add</button>
      </form>

      {error && <div className="panel__error">⚠️ {error}</div>}

      {loading ? (
        <div className="panel__empty">Loading…</div>
      ) : items.length === 0 ? (
        <div className="panel__empty">
          Your pantry is empty. Add what you have at home — RasoiBot will use it
          to figure out what's missing for a recipe.
        </div>
      ) : (
        <ul className="panel__list">
          {items.map((it) => (
            <li key={it.id} className="panel__item">
              <span className="panel__item-main">
                <strong>{it.name}</strong>
                {(it.quantity || it.unit) && (
                  <span className="panel__item-meta">
                    {" — "}
                    {it.quantity ?? ""} {it.unit || ""}
                  </span>
                )}
              </span>
              <button type="button" className="link-danger" onClick={() => remove(it.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
