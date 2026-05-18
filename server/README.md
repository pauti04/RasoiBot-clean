# RasoiBot — Server

The Express API. Serves recipes, pantry, and shopping data; falls back to OpenAI
for recipes not in the local library.

## Stack

- **Node.js 22+** (ESM)
- **Express 5** with `body-parser`, `cors`, `express-rate-limit`
- **OpenAI SDK** for AI fallback (optional — the rest works without a key)
- **SQLite** for persistence (via `better-sqlite3`), seeded from the JSON files on first run

## Layout

```
server/
├── lib/
│   ├── db.js                 # SQLite connection, schema, first-run JSON seed
│   ├── matching.js           # Ingredient ↔ pantry token-set matching
│   ├── recipe.js             # isValidRecipe, normalizeRecipe, AI prompt
│   └── store.js              # Collection store backed by SQLite (same API as before)
├── routes/
│   ├── recipes.js            # Search + cookable scoring + by-id
│   ├── pantry.js             # Pantry CRUD (merge-on-duplicate add)
│   └── shopping.js           # Shopping CRUD + clear-checked + from-recipe
├── test/
│   ├── matching.test.js
│   ├── store.test.js
│   └── validation.test.js
├── data/                     # SQLite db lives here (gitignored)
│   └── rasoibot.db
├── .env.example
├── package.json
├── pantry.json               # Seed file (only read if SQLite pantry table is empty)
├── recipes.json              # Seed file (only read if SQLite recipes table is empty)
├── server.js                 # Express entrypoint
└── shopping.json             # Seed file (only read if SQLite shopping table is empty)
```

## Scripts

| Command         | What it does                                       |
| --------------- | -------------------------------------------------- |
| `npm start`     | Run the server                                     |
| `npm run dev`   | Run with `node --watch` for auto-reload on changes |
| `npm test`      | Run the test suite (`node --test`)                 |

## Configuration

| Variable          | Default        | What it controls                                       |
| ----------------- | -------------- | ------------------------------------------------------ |
| `OPENAI_API_KEY`  | _(unset)_      | Enables the `/api/ai-recipe` and AI-fallback endpoints |
| `OPENAI_MODEL`    | `gpt-4o-mini`  | Model used for AI generation                           |
| `PORT`            | `5175`         | Port the server listens on                             |
| `RASOIBOT_DATA_DIR` | `./data`     | Directory for the SQLite database file                 |

Copy `server/.env.example` to `server/.env` and set the values you need.
**Pantry and shopping endpoints work without `OPENAI_API_KEY`** — the server
starts in a degraded mode where only AI endpoints return `503`.

## API

### Recipes

| Method | Path                                              | Description                                  |
| ------ | ------------------------------------------------- | -------------------------------------------- |
| GET    | `/api/health`                                     | Health + counts + active model               |
| GET    | `/api/recipes?q=&region=&diet=&limit=`            | Scored fuzzy search                          |
| GET    | `/api/recipes/cookable?minCoverage=0.7`           | Recipes mostly covered by pantry             |
| GET    | `/api/recipes/:id`                                | Fetch a single recipe                        |
| POST   | `/api/query`                                      | Body `{ text, region?, diet? }` — local then AI fallback |
| POST   | `/api/ai-recipe`                                  | Body `{ text }` — direct AI generation (rate-limited)    |

### Pantry

| Method | Path                  | Description                                |
| ------ | --------------------- | ------------------------------------------ |
| GET    | `/api/pantry`         | List items                                 |
| POST   | `/api/pantry`         | Body `{ name, quantity?, unit? }` — merges on duplicate name |
| PATCH  | `/api/pantry/:id`     | Patch any of `name`, `quantity`, `unit`    |
| DELETE | `/api/pantry/:id`     | Remove one                                 |
| DELETE | `/api/pantry`         | Clear all                                  |

### Shopping

| Method | Path                              | Description                                                 |
| ------ | --------------------------------- | ----------------------------------------------------------- |
| GET    | `/api/shopping`                   | List items                                                  |
| POST   | `/api/shopping`                   | Body `{ name, quantity?, unit?, from_recipe? }` — merges on duplicate unless already checked |
| PATCH  | `/api/shopping/:id`               | Patch `name` / `quantity` / `unit` / `checked`              |
| DELETE | `/api/shopping/:id`               | Remove one                                                  |
| POST   | `/api/shopping/clear-checked`     | Remove all checked items                                    |
| POST   | `/api/shopping/from-recipe`       | Body `{ recipeId }` — add missing-from-pantry items         |

### Error shape

All errors return:

```json
{ "error": "human-readable message" }
```

### Rate limiting

The `/api/ai-recipe` endpoint is limited to **10 requests / minute per IP**.
Other endpoints are not rate-limited.

## Persistence

Storage is **SQLite** via `better-sqlite3`. The db file lives at
`server/data/rasoibot.db` (override with `RASOIBOT_DATA_DIR`).

Schema is intentionally generic — each collection is a single table with
`(id TEXT PRIMARY KEY, data TEXT)` where `data` is the JSON-serialized row.
This keeps the route code identical whether the underlying store is JSON files
or SQL: predicates run in JS over `store.all()`. The data volumes (hundreds of
recipes, dozens of pantry items) make full-scan reads instant. If a field ever
needs an index, hoist it to its own column in `lib/db.js`.

### Seed on first run

If a SQLite table is empty *and* the matching `<name>.json` file exists at the
working directory, the server seeds the table from JSON on boot. Subsequent
boots skip seeding. The JSON files themselves are not modified at runtime — they
serve as version-controlled seed data.

### Ingredient matching

`lib/matching.js` implements pantry ↔ recipe-ingredient matching with
content-word *set equality* after stripping cooking descriptors (chopped, fresh,
ground, sliced, …). This avoids the false positive where a pantry "ginger"
would otherwise claim to cover "ginger paste". The trade-off is conservatism:
"red onion" pantry won't cover an "onion" ingredient.

## Recipe schema

```jsonc
{
  "id": "dal-tadka",                        // string, unique; auto-slugified from name
  "name": "Dal Tadka",                      // required
  "region": "North Indian",                 // free-form, but use one of the canonical regions
  "tags": ["vegan", "gluten-free"],
  "servings": 4,                            // required
  "prep_time_mins": 10,
  "cook_time_mins": 30,
  "ingredients": [                          // required, non-empty
    { "name": "toor dal", "quantity": 1, "unit": "cup" }
  ],
  "steps": ["…"],                           // required, non-empty
  "notes": "optional"
}
```

Validation lives in `server.js` → `isValidRecipe`. AI responses that don't
match this shape are rejected with `502`.

## Adding a new resource

1. Create the JSON seed file (e.g. `meal-plans.json`) — start with `[]`.
2. Create `routes/meal-plans.js` exporting a router factory.
3. Wire it in `server.js`:
   ```js
   const mealPlansStore = createStore("meal-plans.json", []);
   app.use("/api/meal-plans", mealPlansRouter({ mealPlansStore }).router);
   ```
4. Add the methods to `client/src/api.js` and the CI smoke test in
   `.github/workflows/ci.yml`.
