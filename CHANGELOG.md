# Changelog

All notable changes to RasoiBot are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Standard GitHub community files: `LICENSE`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`
- `.github/` templates: issue forms, PR template, dependabot
- CI workflow: lint + build client, syntax-check server on every push and PR
- Sub-READMEs for `client/` and `server/`
- `.editorconfig` and `.nvmrc` (Node 22)

## [1.2.0] — Pantry & Shopping list

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
