<div align="center">

# RasoiBot 🍲

**An Indian-recipe app with a built-in pantry and shopping list.**

Search a curated recipe library, fall back to AI when nothing matches, track what
you already have at home, and auto-build a shopping list for any recipe.

[![CI](https://github.com/pauti04/RasoiBot-clean/actions/workflows/ci.yml/badge.svg)](https://github.com/pauti04/RasoiBot-clean/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22%2B-339933.svg?logo=node.js&logoColor=white)](.nvmrc)
[![React](https://img.shields.io/badge/react-19-61dafb.svg?logo=react&logoColor=white)](client/package.json)
[![Vite](https://img.shields.io/badge/vite-7-646cff.svg?logo=vite&logoColor=white)](client/package.json)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Quick start](#quick-start)
- [Project layout](#project-layout)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

### 🍽️ Recipes
- Scored fuzzy search with region and diet filters
- AI fallback that returns structured recipe JSON (validated, deduped, persisted)
- Rich recipe cards: ingredients, steps, servings, prep/cook time, tags

### 🥫 Pantry
- Track what you have at home
- Add / merge-on-duplicate / remove

### 🛒 Shopping list
- Check items off, clear checked, manual add
- **Add missing to shopping list** on any recipe — automatically skips
  ingredients already in your pantry or already on the list

### 🍳 What can I cook?
- Surfaces recipes mostly covered by your current pantry
- Shows coverage % and exactly what's still missing

### 🧰 Quality of life
- Tab navigation: Chat / Pantry / Shopping
- Light + dark theme (follows your OS)
- Rate-limited AI endpoint
- Atomic JSON-file writes with debounced flush + graceful shutdown
- Works in degraded mode without an OpenAI key (everything but AI fallback)

## Screenshots

> _Add screenshots to `docs/screenshots/` and link them here once the UI is final._

| Chat | Pantry | Shopping |
| :--: | :----: | :------: |
| _coming soon_ | _coming soon_ | _coming soon_ |

## Quick start

Prerequisites: **Node.js 22+** (see [`.nvmrc`](.nvmrc)) and **npm**.

```bash
git clone https://github.com/pauti04/RasoiBot-clean.git
cd RasoiBot-clean
```

### 1. Server

```bash
cd server
cp .env.example .env       # set OPENAI_API_KEY for AI fallback (optional)
npm install
npm run dev                # http://localhost:5175
```

### 2. Client

```bash
cd client
npm install
npm run dev                # http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) and start asking for recipes.

## Project layout

```
RasoiBot-clean/
├── .github/                    # Issue/PR templates, CI workflow, dependabot
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── dependabot.yml
│   └── workflows/ci.yml
├── client/                     # React + Vite UI    (see client/README.md)
│   └── src/
│       ├── api.js
│       ├── App.jsx
│       └── components/
│           ├── Pantry.jsx
│           ├── RecipeCard.jsx
│           └── Shopping.jsx
├── server/                     # Express API + JSON stores    (see server/README.md)
│   ├── lib/store.js
│   ├── routes/
│   │   ├── recipes.js
│   │   ├── pantry.js
│   │   └── shopping.js
│   ├── server.js
│   ├── recipes.json
│   ├── pantry.json
│   └── shopping.json
├── .editorconfig
├── .nvmrc
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── SECURITY.md
```

Each subproject has its own README with deeper docs:

- 📦 [`client/README.md`](client/README.md) — frontend architecture, scripts, theming
- ⚙️ [`server/README.md`](server/README.md) — full API reference, persistence, schema

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

## API reference

A snapshot — see [`server/README.md`](server/README.md#api) for the full spec.

| Method | Path                                  | Description                              |
| ------ | ------------------------------------- | ---------------------------------------- |
| GET    | `/api/health`                         | Health + counts + active model           |
| GET    | `/api/recipes`                        | Scored search                            |
| GET    | `/api/recipes/cookable`               | Recipes mostly covered by pantry         |
| POST   | `/api/query`                          | Smart query — local then AI fallback     |
| POST   | `/api/ai-recipe`                      | Direct AI generation (rate-limited)      |
| `*`    | `/api/pantry[/:id]`                   | Pantry CRUD                              |
| `*`    | `/api/shopping[/:id]`                 | Shopping CRUD                            |
| POST   | `/api/shopping/from-recipe`           | Add missing-from-pantry items            |

## Development

### Local checks before sending a PR

```bash
# Client
cd client && npm run lint && npm run build

# Server
cd server && node --check server.js
```

CI runs the same checks plus a server boot smoke test on every push and PR.

### Conventions

- **One logical change per PR.** Refactors go in their own PR.
- **No new dependencies without justification.**
- **No CSS-in-JS, no Tailwind** — keep the styling surface small.
- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full set of conventions.

## Roadmap

Nothing here is a commitment — just where the project might go next.

- [ ] Persist pantry/shopping per-user (currently single-user, single-machine)
- [ ] Bulk-import a shopping list from text (paste & parse)
- [ ] Recipe favorites & history
- [ ] Smarter ingredient matching (synonyms, plurals)
- [ ] Optional self-hosted model for AI fallback
- [ ] Mobile-first PWA wrapper

Have an idea? Open a [feature request](.github/ISSUE_TEMPLATE/feature_request.yml).

## Contributing

Pull requests are very welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md) for
how to get set up, the branching workflow, and the coding conventions.

By participating in this project you agree to abide by the
[Code of Conduct](CODE_OF_CONDUCT.md).

If you've found a security issue, please follow [`SECURITY.md`](SECURITY.md)
instead of opening a public issue.

## License

[MIT](LICENSE) © pauti04 and RasoiBot contributors
