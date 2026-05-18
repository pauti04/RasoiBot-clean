import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Shopping({ refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.shopping.list();
      setItems(data.items || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [refreshKey]);

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.shopping.add({
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

  async function toggle(item) {
    const next = !item.checked;
    setItems((xs) => xs.map((x) => x.id === item.id ? { ...x, checked: next } : x));
    try {
      await api.shopping.update(item.id, { checked: next });
    } catch (e) {
      setError(e.message);
      refresh();
    }
  }

  async function remove(id) {
    try {
      await api.shopping.remove(id);
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function clearChecked() {
    try {
      await api.shopping.clearChecked();
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  const checkedCount = items.filter((x) => x.checked).length;

  return (
    <section className="panel">
      <header className="panel__header">
        <h2 className="panel__title">Shopping list</h2>
        <span className="panel__count">
          {items.length - checkedCount} of {items.length} to buy
        </span>
      </header>

      <form className="panel__form" onSubmit={add}>
        <input
          placeholder="Item (e.g., ginger)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Item name"
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
          Nothing on the shopping list yet. Add an item, or open a recipe and
          tap “Add missing to shopping list.”
        </div>
      ) : (
        <>
          <ul className="panel__list">
            {items.map((it) => (
              <li key={it.id} className={`panel__item ${it.checked ? "panel__item--checked" : ""}`}>
                <label className="panel__check">
                  <input
                    type="checkbox"
                    checked={!!it.checked}
                    onChange={() => toggle(it)}
                  />
                  <span className="panel__item-main">
                    <strong>{it.name}</strong>
                    {(it.quantity || it.unit) && (
                      <span className="panel__item-meta">
                        {" — "}
                        {it.quantity ?? ""} {it.unit || ""}
                      </span>
                    )}
                    {it.from_recipe && (
                      <span className="chip" style={{ marginLeft: 6 }}>
                        from {it.from_recipe}
                      </span>
                    )}
                  </span>
                </label>
                <button type="button" className="link-danger" onClick={() => remove(it.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {checkedCount > 0 && (
            <div className="panel__footer">
              <button type="button" className="btn btn--ghost" onClick={clearChecked}>
                Clear {checkedCount} checked
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
