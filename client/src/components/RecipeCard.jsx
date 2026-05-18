import React, { useState } from "react";
import { api } from "../api.js";

export default function RecipeCard({ recipe, onAdded }) {
  const {
    id, name, region, tags = [], servings,
    prep_time_mins, cook_time_mins,
    ingredients = [], steps = [], notes,
  } = recipe;

  const time = (prep_time_mins || 0) + (cook_time_mins || 0);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function addMissing() {
    if (!id) {
      setStatus({ kind: "error", text: "This recipe has no id yet." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const data = await api.shopping.fromRecipe(id);
      const added = data.added?.length || 0;
      const skipped = data.skipped?.length || 0;
      setStatus({
        kind: "ok",
        text: added
          ? `Added ${added} item${added === 1 ? "" : "s"}${skipped ? ` (${skipped} already covered)` : ""}.`
          : "Already covered by your pantry or list.",
      });
      onAdded?.(data);
    } catch (err) {
      setStatus({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

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

      <div className="recipe__actions">
        <button type="button" onClick={addMissing} disabled={busy} className="btn btn--accent">
          {busy ? "Adding…" : "🛒 Add missing to shopping list"}
        </button>
        {status && (
          <span className={`recipe__status recipe__status--${status.kind}`}>
            {status.text}
          </span>
        )}
      </div>
    </article>
  );
}
