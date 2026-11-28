.PHONY: init-env dev up down logs migrate seed bootstrap test lint backup release

init-env:
	python scripts/init_env.py

dev: init-env
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

up: init-env
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=100

migrate:
	docker compose exec api sh -c 'DATABASE_URL="$$MIGRATION_DATABASE_URL" alembic upgrade head'

seed:
	cd backend && uv run --locked python scripts/seed_demo.py

bootstrap:
	docker compose exec api python -m app.modules.users.bootstrap

test:
	cd backend && uv run --locked pytest
	cd frontend && pnpm test

lint:
	cd backend && uv run --locked ruff check app scripts tests
	cd frontend && pnpm lint && pnpm typecheck

backup:
	sh ./deploy/backup.sh

release:
	sh ./deploy/release.sh
