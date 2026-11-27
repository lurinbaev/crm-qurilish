#!/bin/sh
set -eu

mkdir -p deploy/backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup="deploy/backups/construction-crm-$stamp.dump"
docker compose -f docker-compose.prod.yml exec -T db sh -c 'pg_dump --format=custom --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' > "$backup"
echo "Backup written to $backup"
