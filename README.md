# RasoiBot 🍲

An Indian-recipe app with a built-in pantry and shopping list. Search a curated recipe library; fall back to AI generation when nothing matches; track what's in your kitchen; auto-build a shopping list for any recipe.

React + Vite frontend, Express + OpenAI backend, JSON-file storage.

## Features

### Recipes
- 🔎 Scored fuzzy search with region and diet filters
- 🤖 AI fallback that returns structured recipe JSON (validated, deduped, persisted)
- 🧾 Rich recipe cards: ingredients, steps, servings, prep/cook time, tags

### Pantry & shopping
- 🥫 **Pantry**: track what you have at home (add / remove / merge duplicates)
- 🛒 **Shopping list**: check items off, clear checked, manual add
- ➕ **Add missing to shopping list** on any recipe — automatically skips ingredients already in your pantry or already on the list
- 🍳 **What can I cook?** — surfaces recipes mostly covered by your current pantry, showing coverage % and what's still missing

### Plumbing
- 🚦 Rate-limited AI endpoint
- 💾 Atomic JSON-file writes, debounced flush, graceful shutdown
- 🌗 Light/dark UI (follows OS preference)

## Project layout

```
RasoiBot-clean/
├── client/                # React + Vite UI
│   └── src/
│       ├── components/    # RecipeCard, Pantry, Shopping
│       ├── api.js         # API client
│       └── App.jsx        # Tab shell + Chat view
└── server/
    ├── lib/store.js       # JSON-file store helper
    ├── routes/            # recipes, pantry, shopping
    ├── server.js          # Express entrypoint
    ├── recipes.json       # Recipe library (seed + AI-added)
    ├── pantry.json        # User pantry
    └── shopping.json      # User shopping list
```

## Quick start

### 1. Server

```bash
cd server
cp .env.example .env   # then set OPENAI_API_KEY (optional — pantry/shopping work without it)
npm install
npm run dev            # or: npm start
```

Listens on `http://localhost:5175` by default.

### 2. Client

```bash
cd client
npm install
npm run dev
```

Vite prints the local dev URL (typically `http://localhost:5173`). Point it at a non-default API by setting `VITE_API_URL` in `client/.env`.

## API

### Recipes

| Method | Path                          | Description                                          |
| ------ | ----------------------------- | ---------------------------------------------------- |
| GET    | `/api/health`                 | Health + counts + active model                       |
| GET    | `/api/recipes?q=&region=&diet=&limit=` | Scored search                              |
| GET    | `/api/recipes/cookable?minCoverage=0.7` | Recipes mostly covered by pantry          |
| GET    | `/api/recipes/:id`            | Fetch one                                            |
| POST   | `/api/query`                  | Smart query — local first, AI fallback               |
| POST   | `/api/ai-recipe`              | Direct AI generation (rate-limited)                  |

### Pantry

| Method | Path                  | Description                                |
| ------ | --------------------- | ------------------------------------------ |
| GET    | `/api/pantry`         | List items                                 |
| POST   | `/api/pantry`         | Add (merges on duplicate name)             |
| PATCH  | `/api/pantry/:id`     | Update name / quantity / unit              |
| DELETE | `/api/pantry/:id`     | Remove one                                 |
| DELETE | `/api/pantry`         | Clear all                                  |

### Shopping

| Method | Path                              | Description                                                 |
| ------ | --------------------------------- | ----------------------------------------------------------- |
| GET    | `/api/shopping`                   | List items                                                  |
| POST   | `/api/shopping`                   | Add (merges on duplicate name unless already checked)       |
| PATCH  | `/api/shopping/:id`               | Update name / quantity / unit / checked                     |
| DELETE | `/api/shopping/:id`               | Remove one                                                  |
| POST   | `/api/shopping/clear-checked`     | Remove all checked items                                    |
| POST   | `/api/shopping/from-recipe`       | Body `{ "recipeId": "…" }` — add missing-from-pantry items  |

## Configuration

`server/.env`

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
PORT=5175
```

`client/.env` (optional)

```
VITE_API_URL=http://localhost:5175
```

## License

MIT
