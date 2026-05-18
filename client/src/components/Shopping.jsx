import React, { useState } from "react";
import { api } from "../api.js";
import { toast } from "../lib/toast.js";

export default function Shopping({ items, setItems, refresh }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  async function add(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const tempId = `tmp_${Date.now()}`;
    const optimistic = {
      id: tempId,
      name: trimmed,
      quantity: quantity ? Number(quantity) : null,
      unit: unit.trim() || "",
      checked: false,
      from_recipe: null,
      from_recipe_name: null,
      added_at: new Date().toISOString(),
    };
    setItems((curr) => [...curr, optimistic]);
    setName(""); setQuantity(""); setUnit("");

    try {
      await api.shopping.add({
        name: trimmed,
        quantity: optimistic.quantity,
        unit: optimistic.unit || undefined,
      });
      await refresh();
    } catch (err) {
      setItems((curr) => curr.filter((x) => x.id !== tempId));
      toast.error(err.message);
    }
  }

  async function toggle(item) {
    const next = !item.checked;
    setItems((curr) => curr.map((x) => x.id === item.id ? { ...x, checked: next } : x));
    try {
      await api.shopping.update(item.id, { checked: next });
    } catch (err) {
      // revert
      setItems((curr) => curr.map((x) => x.id === item.id ? { ...x, checked: !next } : x));
      toast.error(err.message);
    }
  }

  async function remove(id, displayName) {
    const prev = items;
    setItems((curr) => curr.filter((x) => x.id !== id));
    try {
      await api.shopping.remove(id);
      toast.info(`Removed ${displayName}.`);
    } catch (err) {
      setItems(prev);
      toast.error(err.message);
    }
  }

  async function clearChecked() {
    const prev = items;
    const checkedCount = prev.filter((x) => x.checked).length;
    setItems((curr) => curr.filter((x) => !x.checked));
    try {
      await api.shopping.clearChecked();
      toast.success(`Cleared ${checkedCount} checked item${checkedCount === 1 ? "" : "s"}.`);
    } catch (err) {
      setItems(prev);
      toast.error(err.message);
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
            <div className="empty__hero" aria-hidden="true">🛒</div>
            <div className="empty__title">Nothing on the list yet</div>
            <div>Open a recipe and add what you're missing — or add an item directly above.</div>
          </div>
        ) : (
          <>
            <ul className="list">
              {items.map((it) => (
                <li key={it.id} className={`list__row ${it.checked ? "list__row--checked" : ""}`}>
                  <label className="list__check">
                    <input
                      type="checkbox"
                      checked={!!it.checked}
                      onChange={() => toggle(it)}
                      aria-label={`Mark ${it.name} as ${it.checked ? "unchecked" : "checked"}`}
                    />
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
