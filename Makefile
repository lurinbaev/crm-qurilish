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
	docker compose exec api python -m scripts.seed

bootstrap:
	docker compose exec api python -m app.modules.users.bootstrap

test:
	cd backend && uv run --locked pytest

lint:
	cd backend && uv run --locked ruff check app scripts tests

backup:
	sh ./deploy/backup.sh

release:
	sh ./deploy/release.sh
