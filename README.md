# Construction CRM

FastAPI + SQLModel backend, PostgreSQL/Alembic, and modular Next.js App Router frontend. CRM screens and public apartment catalog are in Uzbek (Latin); the UI uses a restrained glass surface treatment with deep navy and turquoise accents.

## Local development

1. Run `python scripts/init_env.py` to create a local `.env` while preserving existing values.
2. Run `make dev` (or `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`).
3. Open `http://localhost:3000`; API documentation is at `http://localhost:8001/docs`.
4. Create the first company administrator with `make bootstrap`.

The dev override exposes database/API/web only on loopback, mounts frontend source with hot reload, and does not route traffic through the production Nginx container.

## Production

`docker-compose.prod.yml` runs PostgreSQL, a one-shot migration service, the API, and a standalone Next.js web container. The web app is bound to `127.0.0.1:${APP_PORT}` for the VPS reverse proxy. Set `NEXT_PUBLIC_COMPANY_SLUG` to the real company slug for the public catalog. Deploy via the project-scoped `server-deploy` workflow; no production deploy was run as part of local implementation.

## Testing and checks

- `make test` — backend pytest and frontend Vitest suites.
- `make lint` — Ruff, ESLint, and TypeScript checks.
- `cd frontend && pnpm build` — production Next.js build.
- Existing Alembic revisions are retained. Sale confirmation requires a lead in `viewing`, atomically marks it `won` and its apartment `sold`, and records both changes in audit history.

## Demo data (separate test database only)

`backend/scripts/seed_demo.py` creates idempotent Uzbek synthetic users, complexes, apartments, leads, and an audit row. It does not read `DATABASE_URL`. Supply `SEED_DATABASE_URL` for a dedicated PostgreSQL database whose name includes a clear `test` marker, `ENVIRONMENT=test`, `SEED_CONFIRM_TEST_DB=YES`, and three 12+ character passwords (`SEED_ADMIN_PASSWORD`, `SEED_SELLER_PASSWORD`, `SEED_VIEWER_PASSWORD`), then run `cd backend && uv run --locked python scripts/seed_demo.py`. The script was not run because the separate test database settings have not yet been provided.

Demo usernames: `demo-admin`, `demo-sotuvchi`, and `demo-kuzatuvchi`; passwords are supplied at execution and never committed. Run migrations against that same test DB first if its schema is empty.

## Environment and commands

`make init-env`, `make dev`, `make up`, `make down`, `make logs`, `make migrate`, `make bootstrap`, `make backup`, and `make release` provide common operations. Do not run `docker compose down -v` if the persistent database volume must be retained.

GitHub Actions tests and builds both images on pushes and pull requests. The optional production deploy is gated behind `workflow_dispatch` and the project-scoped broker SSH secrets.
