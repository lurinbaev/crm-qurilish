#!/bin/sh
set -eu

psql \
  --set ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set="MIGRATION_USER=$MIGRATION_DB_USER" \
  --set="MIGRATION_PASSWORD=$MIGRATION_DB_PASSWORD" \
  --set="APP_USER=$APP_DB_USER" \
  --set="APP_PASSWORD=$APP_DB_PASSWORD" \
  --set="DATABASE_NAME=$POSTGRES_DB" \
  --file /docker-entrypoint-initdb.d/20-roles.sql.template
