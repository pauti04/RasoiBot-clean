# Contributing to RasoiBot

Thanks for your interest in improving RasoiBot. This guide covers the basics —
how to get set up, the workflow we follow, and a few conventions worth knowing
before you open a PR.

## Ground rules

- Be kind. See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
- Open an issue before sending a large change, so we can discuss scope.
- Small, focused PRs are easier to review than sprawling ones.

## Local setup

Prerequisites: **Node.js 22+** (see [`.nvmrc`](.nvmrc)) and **npm**.

```bash
git clone https://github.com/pauti04/RasoiBot-clean.git
cd RasoiBot-clean

# Server
cd server
cp .env.example .env       # set OPENAI_API_KEY if you want the AI fallback
npm install
npm run dev                # http://localhost:5175

# Client (new terminal)
cd ../client
npm install
npm run dev                # http://localhost:5173
```

See the sub-READMEs for details:
- [`client/README.md`](client/README.md)
- [`server/README.md`](server/README.md)

## Branching & PR workflow

1. Fork the repo (or branch directly if you have access).
2. Create a topic branch: `feat/short-description` or `fix/short-description`.
3. Commit in small logical chunks. The commit message style we use:
   - First line: imperative, ≤ 70 chars (`Add pantry merge-on-duplicate`)
   - Body: bullet points explaining the *why* and any non-obvious choices
4. Run lint + build before pushing:
   ```bash
   cd client && npm run lint && npm run build
   cd ../server && node --check server.js
   ```
5. Open a PR against `main`. CI will run automatically.
6. Fill out the PR template — especially the **Test plan** section.

## Coding conventions

### General
- **No new dependencies without justification.** Prefer the platform/stdlib.
- **Don't over-engineer.** A flat function beats a premature abstraction.
- **No drive-by refactors** in feature PRs. Send refactors as their own PR.

### Server
- Endpoints live under `server/routes/*.js`, one file per resource.
- Persistence goes through `server/lib/store.js` — never write files directly.
- New endpoints must:
  - Validate inputs at the boundary
  - Return JSON
  - Use the existing error shape: `{ error: "human-readable message" }`

### Client
- Components live in `client/src/components/`, one file per component.
- API calls go through `client/src/api.js` — don't call `fetch` from components.
- Styling lives in `App.css` using the CSS variables in `index.css`. No CSS-in-JS,
  no Tailwind, no component libraries — keep the surface small.

### Recipes
- Recipe objects must have at minimum: `id`, `name`, `servings`, `ingredients[]`,
  `steps[]`. See `server.js` → `isValidRecipe`.
- Ingredient names should be normalizable — prefer `"toor dal"` over
  `"Toor Dal (split pigeon peas, washed)"`.

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml). Please include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your Node version + OS

## Proposing features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml).
Describe the user-facing problem first; the implementation second.

## License

By contributing, you agree that your contributions will be licensed under the
project's [MIT license](LICENSE).
