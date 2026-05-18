import React, { useState } from "react";
import { api } from "../api.js";
import { toast } from "../lib/toast.js";

export default function Pantry({ items, setItems, refresh }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  async function add(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    // Optimistic add — show immediately, reconcile on response
    const tempId = `tmp_${Date.now()}`;
    const optimistic = {
      id: tempId,
      name: trimmed,
      quantity: quantity ? Number(quantity) : null,
      unit: unit.trim() || "",
      added_at: new Date().toISOString(),
    };
    setItems((curr) => [...curr, optimistic]);
    setName(""); setQuantity(""); setUnit("");

    try {
      await api.pantry.add({
        name: trimmed,
        quantity: optimistic.quantity,
        unit: optimistic.unit || undefined,
      });
      await refresh();
      toast.success(`Added ${trimmed} to your pantry.`);
    } catch (err) {
      setItems((curr) => curr.filter((x) => x.id !== tempId));
      toast.error(err.message);
    }
  }

  async function remove(id, displayName) {
    const prev = items;
    setItems((curr) => curr.filter((x) => x.id !== id));
    try {
      await api.pantry.remove(id);
      toast.info(`Removed ${displayName}.`);
    } catch (err) {
      setItems(prev);
      toast.error(err.message);
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
            autoComplete="off"
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

        {items.length === 0 ? (
          <div className="empty">
            <div className="empty__hero" aria-hidden="true">🥫</div>
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
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => remove(it.id, it.name)}
                  aria-label={`Remove ${it.name}`}
                >
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
