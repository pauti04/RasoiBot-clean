import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Shopping({ items, refresh }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => { setError(null); }, [items]);

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
    try {
      await api.shopping.update(item.id, { checked: !item.checked });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(id) {
    try {
      await api.shopping.remove(id);
      refresh();
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
  const remaining = items.length - checkedCount;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-head">
        <span className="page-head__eyebrow">Shopping list</span>
        <h1 className="page-head__title">What you need to buy</h1>
        <p className="page-head__lede">
          Open a recipe and tap “Add missing to shopping list” — anything already
          in your pantry gets skipped. Check items off as you shop.
        </p>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">List</h2>
          <span className="panel__count">
            {remaining} to buy{checkedCount > 0 ? ` · ${checkedCount} checked` : ""}
          </span>
        </div>

        <form className="add-form" onSubmit={add}>
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
            <div className="empty__hero">🛒</div>
            <div className="empty__title">Nothing on the list yet</div>
            <div>Open a recipe and add what you're missing — or add an item directly above.</div>
          </div>
        ) : (
          <>
            <ul className="list">
              {items.map((it) => (
                <li key={it.id} className={`list__row ${it.checked ? "list__row--checked" : ""}`}>
                  <label className="list__check">
                    <input type="checkbox" checked={!!it.checked} onChange={() => toggle(it)} aria-label={it.name} />
                  </label>
                  <div className="list__main">
                    <div className="list__name">{it.name}</div>
                    <div className="list__meta">
                      {(it.quantity || it.unit) && (
                        <span>{it.quantity ?? ""} {it.unit || ""}</span>
                      )}
                      {(it.from_recipe_name || it.from_recipe) && (
                        <span className="chip chip--brand">
                          from {it.from_recipe_name || it.from_recipe}
                        </span>
                      )}
                    </div>
                  </div>
                  <button type="button" className="icon-btn" onClick={() => remove(it.id)} aria-label={`Remove ${it.name}`}>
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
    </div>
  );
}
