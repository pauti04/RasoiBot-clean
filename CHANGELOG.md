# Changelog

All notable changes to RasoiBot are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] — UI & UX redesign

Whole-shell rebuild. Same features, completely different surface.

### Added
- **Sidebar shell** with the brand mark, primary nav (Discover / Pantry /
  Shopping), and live counts next to each tab.
- **Bottom-tab bar on mobile**, sidebar collapses below 860px.
- **Discover** view replaces the chat metaphor: search-first, region/diet
  filters as pills, recipe grid, and inline recipe detail.
- **Pantry-aware recipe detail**: ingredients are checked off vs. flagged as
  "need to buy" based on what's in your pantry. The CTA shows the exact
  missing count (e.g. "🛒 Add 5 missing items to shopping list").
- **From-your-pantry suggestions**: the cookable endpoint feeds a section that
  appears when you have anything in your pantry — coverage % shown per card.
- **Try-one-of-these starters** when search is empty.
- **AI fallback affordance**: when local search has no hit, an explicit
  "✨ Invent a recipe for X" button is offered.
- **Fraunces** serif for headlines (Google Fonts) + Inter for UI.
- **Warm spice palette** — paprika brand, turmeric accent, cream surfaces;
  full dark-mode variant.

### Changed
- `RecipeCard` is now a condensed grid tile (title, meta, tags). The full
  ingredients/steps view lives in `RecipeDetail.jsx`, opened inline.
- `Pantry` and `Shopping` are now data-driven (props from `App.jsx`); the
  parent owns refresh, so cross-view changes stay in sync.

### Removed
- Chat-stream metaphor (typing indicator, message bubbles, suggestion chips
  as starter messages).

## [1.3.0] — SQLite, tests, smarter matching

### Added
- **SQLite persistence** via `better-sqlite3`. Generic `(id, data)` schema per
  collection; data file lives at `server/data/rasoibot.db`
  (override with `RASOIBOT_DATA_DIR`).
- Auto-seed on first run: legacy `recipes.json` / `pantry.json` / `shopping.json`
  populate the SQLite tables if empty.
- Test suite via `node --test`: 27 tests covering the store, ingredient
  matching, and recipe validation.
- `server/lib/recipe.js` — pure helpers (`isValidRecipe`, `normalizeRecipe`,
  `composeAIPrompt`) separated from the HTTP entry point so tests can import them.
- `server/lib/matching.js` — token-set ingredient matching.
- Shopping items now carry `from_recipe_name` (denormalized); the UI shows
  the recipe name instead of the slug.
- CI now runs `npm test` for the server.

### Changed
- Ingredient matching now uses content-word **set equality** after stripping
  cooking descriptors. Conservative but no false positives.
- `isValidRecipe` enforces ingredient `name: string` and numeric `quantity`,
  and rejects empty/whitespace-only steps.
- AI-generated recipe IDs use `uniqueSlug` to avoid collisions with existing
  recipes (`dal-tadka` → `dal-tadka-2`, `-3`, …).
- `npm audit fix` applied: bumped vulnerable transitive deps in `body-parser`,
  `express-rate-limit`, `ip-address`, `path-to-regexp`, `qs`.

### Fixed
- Pantry "ginger" no longer falsely covers a recipe's "ginger paste".
- `recipes.json` had a duplicate `dal-tadka` entry — removed.

### Removed
- Old JSON-file store (replaced by SQLite-backed store with the same API).

## [1.2.0] — Pantry, shopping list, community files

### Added
- **Pantry**: track ingredients you have at home (add, merge-on-duplicate, remove)
- **Shopping list**: check items off, clear checked, manual add
- **RecipeCard → "Add missing to shopping list"**: subtracts pantry + already-listed items
- **"What can I cook?"**: surfaces recipes mostly covered by pantry with coverage % and missing-ingredient breakdown
- New endpoints:
  - `GET /api/recipes/cookable?minCoverage=`
  - `GET/POST/PATCH/DELETE /api/pantry[/:id]`
  - `GET/POST/PATCH/DELETE /api/shopping[/:id]`
  - `POST /api/shopping/clear-checked`
  - `POST /api/shopping/from-recipe`
- Tiny JSON-file store (`server/lib/store.js`) with atomic writes, debounced
  flush, and graceful-shutdown hooks
- Modularized server: `routes/recipes.js`, `routes/pantry.js`, `routes/shopping.js`
- Client tab shell (Chat / Pantry / Shopping), `Pantry.jsx`, `Shopping.jsx`,
  `RecipeCard.jsx`, `api.js`
- Standard GitHub community files: `LICENSE`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`
- `.github/` templates: issue forms, PR template, dependabot
- CI workflow: lint + build client, syntax-check server on every push and PR
- Sub-READMEs for `client/` and `server/`
- `.editorconfig` and `.nvmrc` (Node 22)

### Changed
- OpenAI client is now lazy — the rest of the API works without an API key
- `/api/health` reports recipe + pantry + shopping counts

### Fixed
- `cookable` endpoint now treats `minCoverage=0` correctly (previously fell
  back to the default because of `0 || 0.7`)

## [1.1.0] — UI & API polish

### Added
- Redesigned chat UI: recipe cards, region/diet filters, suggestion chips,
  typing indicator, dark-mode-aware theme
- Scored fuzzy search; dedupe on AI-generated recipes
- New endpoints: `GET /api/health`, `GET /api/recipes`
- Root `README.md`, `server/.env.example`, broader `.gitignore`

### Removed
- Default Vite template files (`client/README.md`, `vite.svg`, `react.svg`)
- Stale `server/server.js.bak`

## [1.0.0] — Initial public release

Initial RasoiBot project: React + Vite frontend, Express + OpenAI backend,
local recipe library with AI fallback.
