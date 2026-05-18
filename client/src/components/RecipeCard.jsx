import React from "react";

export default function RecipeCard({ recipe, coverage, onOpen }) {
  const {
    name, region, tags = [], servings,
    prep_time_mins, cook_time_mins,
  } = recipe;

  const time = (prep_time_mins || 0) + (cook_time_mins || 0);
  const isAI = !recipe._fromLibrary;

  return (
    <button type="button" className={`card ${isAI ? "card--ai" : ""}`} onClick={onOpen}>
      <div className="card__top">
        <h3 className="card__title">{name}</h3>
        {coverage !== undefined && (
          <span className="card__coverage">{Math.round(coverage * 100)}%</span>
        )}
      </div>
      <div className="card__meta">
        {region && <span>{region}</span>}
        {region && (servings || time) && <span className="card__dot">·</span>}
        {servings && <span>{servings} servings</span>}
        {time > 0 && <span className="card__dot">·</span>}
        {time > 0 && <span>{time} min</span>}
      </div>
      {tags.length > 0 && (
        <div className="card__tags">
          {tags.slice(0, 4).map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      )}
    </button>
  );
}
