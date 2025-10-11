# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Express server entry (`app.js`), with `routes/`, `services/`, `middleware/`, `utils/`, `validators/`, `models/`.
- `cli/`: Interactive admin/ops CLI (`cli/index.js`).
- `scripts/`: Maintenance and data tools (migration, status, tests helpers).
- `config/`: App config (`config.js` from `config.example.js`).
- `web/admin-spa/`: Optional admin UI (built assets served by backend).
- `data/`, `logs/`, `prompt/`, `resources/`: Runtime data, logs, prompts, and assets.

## Build, Test, and Development Commands
- Quick start: `make setup && make dev` (copies `.env`/config, starts nodemon).
- Install only: `npm install` and `npm run install:web` (for admin UI).
- Run dev: `npm run dev` (hot reload). Production: `npm start`.
- Lint/format: `npm run lint`, `npm run format` (Prettier + ESLint fix).
- Tests: `npm test` (Jest). Coverage (optional): `npm test -- --coverage`.
- Web build: `npm run build:web`.
- Docker: `npm run docker:build`, `npm run docker:up`, `npm run docker:down`.
- Service control: `npm run service:start:daemon`, `npm run service:status`, `npm run service:logs:follow`.

## Coding Style & Naming Conventions
- Language: Node.js ≥ `18`. Use `const`/`let`, avoid `var`.
- Prettier: no semicolons, single quotes, width 100, 2‑space tabs.
- ESLint: extends `eslint:recommended` + Prettier; enforce `eqeqeq`, `prefer-const`, arrow callbacks.
- Filenames: camelCase for modules (e.g., `apiKeyService.js`), `kebab-case` for scripts.
- Run `npm run lint` before pushing; CI expects clean lint.

## Testing Guidelines
- Frameworks: Jest (+ Supertest for HTTP routes).
- Location: co-locate as `*.test.js` or under `tests/` (e.g., `tests/openaiRoutes.test.js`).
- Conventions: one concern per test file; mock Redis/external calls.
- Run locally: `npm test`. Aim for ≥80% coverage where practical.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Keep messages imperative, concise.
- PRs must include: clear description, linked issues, validation steps; attach screenshots for `web/` changes.
- Before opening PR: `make test && npm run lint`; update `README.md`/examples if flags or envs change.

## Security & Configuration Tips
- Never commit secrets. Copy `.env.example` to `.env` and edit locally; update examples when adding new vars.
- Update `config/config.js` from `config.example.js`; avoid logging secrets (`logs/`). Rotate API keys when testing.
