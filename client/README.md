# RasoiBot — Client

The React + Vite frontend. Talks to the [server](../server) over a small JSON API.

## Stack

- **React 19** with hooks (no class components)
- **Vite 7** for dev server, HMR, and production builds
- **ESLint 9** flat config (`eslint.config.js`)
- Plain CSS with CSS variables — no Tailwind, no CSS-in-JS

## Layout

```
client/
├── public/                  # Static assets served as-is
├── src/
│   ├── api.js               # Thin fetch wrapper — the only place that talks to the server
│   ├── App.css              # All component styles, using vars from index.css
│   ├── App.jsx              # Tab shell + Chat view
│   ├── components/
│   │   ├── Pantry.jsx       # Pantry tab: add / remove ingredients
│   │   ├── RecipeCard.jsx   # Recipe display + "add missing to shopping list"
│   │   └── Shopping.jsx     # Shopping tab: check off, clear, manual add
│   ├── index.css            # CSS variables + base resets (light/dark)
│   └── main.jsx             # Entry point
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

## Scripts

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start Vite dev server (default `:5173`)       |
| `npm run build`    | Production build to `dist/`                   |
| `npm run preview`  | Serve `dist/` locally                         |
| `npm run lint`     | Run ESLint against `src/`                     |

## Configuration

The client reads one environment variable:

| Variable        | Default                  | What it controls                |
| --------------- | ------------------------ | ------------------------------- |
| `VITE_API_URL`  | `http://localhost:5175`  | Base URL of the RasoiBot server |

Create `client/.env` to override:

```
VITE_API_URL=https://my-rasoi-api.example.com
```

## State model

There's no Redux / Zustand / Context here — state is local to the component
that owns it. The two pieces that cross component boundaries:

- `App.jsx` owns the active **tab** and a `shoppingTick` counter
- Adding to the shopping list from a recipe bumps `shoppingTick`, which the
  Shopping component watches as a `refreshKey` to re-fetch the list

This keeps the architecture flat. If state grows beyond a couple of cross-cuts,
factor it into a small `useContext` provider rather than reaching for a global
store.

## API surface used

| Method | Path                              | Where in the client       |
| ------ | --------------------------------- | ------------------------- |
| POST   | `/api/query`                      | Chat search box           |
| GET    | `/api/recipes/cookable`           | "What can I cook?" button |
| GET    | `/api/pantry`                     | Pantry tab                |
| POST   | `/api/pantry`                     | Pantry add form           |
| DELETE | `/api/pantry/:id`                 | Pantry remove button      |
| GET    | `/api/shopping`                   | Shopping tab              |
| POST   | `/api/shopping`                   | Shopping add form         |
| PATCH  | `/api/shopping/:id`               | Toggle checked            |
| DELETE | `/api/shopping/:id`               | Shopping remove button    |
| POST   | `/api/shopping/clear-checked`     | "Clear N checked" button  |
| POST   | `/api/shopping/from-recipe`       | RecipeCard add-to-list    |

All wrapped by [`src/api.js`](src/api.js).

## Styling

Theme values are CSS variables on `:root` (light) with a `@media (prefers-color-scheme: dark)` override. To change the look, edit
[`src/index.css`](src/index.css). Component-specific styles live in
[`src/App.css`](src/App.css).

## Adding a new view

1. Create the component in `src/components/MyView.jsx`.
2. Add it to the tab list in [`App.jsx`](src/App.jsx).
3. If it talks to the server, add the methods to [`src/api.js`](src/api.js)
   — don't call `fetch` from the component directly.
