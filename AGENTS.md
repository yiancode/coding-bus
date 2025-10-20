# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Express entry `app.js` with `routes/`, `services/`, `middleware/`, `utils/`, `validators/`, and `models/`; group new features under the relevant module.
- `cli/`: interactive admin and operations tooling located at `cli/index.js`.
- `scripts/`: maintenance utilities such as migrations, status probes, and test helpers.
- `web/admin-spa/`: optional admin UI; build assets here before serving through the backend.
- `config/`: copy `config.example.js` to `config.js` and keep environment-driven settings in sync with `.env`.
- Runtime directories `data/`, `logs/`, `prompt/`, and `resources/` persist app data, logs, prompt text, and static assets respectively.

## Build, Test, and Development Commands
- `make setup`: prepare local configuration (copy env/config templates) and install dependencies.
- `make dev` or `npm run dev`: launch the development server with nodemon hot reload.
- `npm test`: run the Jest suite; use `npm test -- --coverage` when verifying coverage targets.
- `npm run lint` / `npm run format`: apply ESLint and Prettier autofixes; keep the working tree clean before PRs.
- `npm run build:web`: compile the admin SPA; run prior to serving static assets in production.

## Coding Style & Naming Conventions
- Target Node.js 18+, use `const`/`let`, and avoid `var`.
- Prettier is configured for 2-space indent, 100-character width, single quotes, and no semicolons.
- ESLint extends `eslint:recommended` plus Prettier rules, enforcing `eqeqeq`, `prefer-const`, and arrow callbacks.
- Name modules in camelCase (e.g., `apiKeyService.js`) and scripts in kebab-case.

## Testing Guidelines
- Jest is the primary framework; Supertest is available for HTTP routes.
- Co-locate specs as `*.test.js` or place them under `tests/`; keep each file focused on one concern.
- Mock Redis or external integrations to maintain deterministic runs and faster feedback loops.
- Aim for ≥80% coverage on new code paths and document notable gaps in PR descriptions.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (e.g., `feat: add audit log route`); keep messages imperative and concise.
- Before opening a PR, run `make test` and `npm run lint`; confirm the working tree remains clean.
- Provide a clear description, link relevant issues, and attach admin UI screenshots when modifying `web/` assets.
- Highlight configuration or migration changes and update examples in `README.md` when adding new environment variables.

## Security & Configuration Tips
- Never commit secrets; copy `.env.example` to `.env` for local overrides.
- Keep `config/config.js` aligned with checked-in templates and avoid logging sensitive values to `logs/`.
- Rotate API keys after testing external integrations and remove temporary credentials from the repository.
