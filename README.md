# RasoiBot 🍲

An Indian-recipe chatbot. Search a local library of curated recipes; fall back to AI generation when nothing matches. React + Vite frontend, Express + OpenAI backend.

## Features

- 🔎 Fuzzy local search with region and diet filters
- 🤖 AI fallback that returns structured recipe JSON (validated and deduped)
- 🧾 Rich recipe cards: ingredients, steps, servings, prep/cook time, tags
- 💾 Newly generated recipes are persisted to `recipes.json`
- 🚦 Rate-limited AI endpoint
- 🌗 Light/dark mode (follows OS preference)

## Project layout

```
RasoiBot-clean/
├── client/   # React + Vite UI
└── server/   # Express API + recipe store
```

## Quick start

### 1. Server

```bash
cd server
cp .env.example .env   # then set OPENAI_API_KEY
npm install
npm run dev            # or: npm start
```

The API listens on `http://localhost:5175` by default.

### 2. Client

```bash
cd client
npm install
npm run dev
```

Vite will print the local dev URL (typically `http://localhost:5173`). Point it at a non-default API by setting `VITE_API_URL` in `client/.env`.

## API

| Method | Path                | Description                                        |
| ------ | ------------------- | -------------------------------------------------- |
| GET    | `/api/health`       | Health check + recipe count + active model         |
| GET    | `/api/recipes`      | Search local recipes — `?q=&region=&diet=&limit=`  |
| GET    | `/api/recipe/:id`   | Fetch a single recipe by id                        |
| POST   | `/api/query`        | Smart query — local first, AI fallback             |
| POST   | `/api/ai-recipe`    | Direct AI generation (rate-limited)                |

Request body for `/api/query` and `/api/ai-recipe`:

```json
{ "text": "dal for 4", "region": "North Indian", "diet": "vegan" }
```

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
