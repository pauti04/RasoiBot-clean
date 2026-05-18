# RasoiBot — Server

The Express API. Serves recipes, pantry, and shopping data; falls back to OpenAI
for recipes not in the local library.

## Stack

- **Node.js 22+** (ESM)
- **Express 5** with `body-parser`, `cors`, `express-rate-limit`
- **OpenAI SDK** for AI fallback (optional — the rest works without a key)
- **JSON files** for persistence (`recipes.json`, `pantry.json`, `shopping.json`)

## Layout

```
server/
├── lib/
│   └── store.js              # Tiny JSON-file store (atomic writes, debounced flush)
├── routes/
│   ├── recipes.js            # Search + cookable scoring + by-id
│   ├── pantry.js             # Pantry CRUD (merge-on-duplicate add)
│   └── shopping.js           # Shopping CRUD + clear-checked + from-recipe
├── .env.example
├── package.json
├── pantry.json               # User pantry (starts empty)
├── recipes.json              # Recipe library (seeded; AI-added recipes append here)
├── server.js                 # Express entrypoint
└── shopping.json             # User shopping list (starts empty)
```

## Scripts

| Command         | What it does                                       |
| --------------- | -------------------------------------------------- |
| `npm start`     | Run the server                                     |
| `npm run dev`   | Run with `node --watch` for auto-reload on changes |

## Configuration

| Variable          | Default        | What it controls                                       |
| ----------------- | -------------- | ------------------------------------------------------ |
| `OPENAI_API_KEY`  | _(unset)_      | Enables the `/api/ai-recipe` and AI-fallback endpoints |
| `OPENAI_MODEL`    | `gpt-4o-mini`  | Model used for AI generation                           |
| `PORT`            | `5175`         | Port the server listens on                             |

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

`lib/store.js` provides a tiny JSON-file store with:

- **Atomic writes** — writes go to `<file>.tmp` and `rename()` over the target
- **Debounced flush** — a burst of writes gets coalesced into one disk write
- **Graceful shutdown** — `SIGINT` / `SIGTERM` flush pending writes before exit

The same store is used for all three JSON files. If you replace it with a real
database, swap `createStore` and the routes don't need to change.

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
