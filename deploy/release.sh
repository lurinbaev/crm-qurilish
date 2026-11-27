#!/bin/sh
set -eu

: "${APP_IMAGE:?Set APP_IMAGE to the image tag to release}"
export APP_IMAGE
sh ./deploy/backup.sh
docker compose -f docker-compose.prod.yml pull api migrate
docker compose -f docker-compose.prod.yml up -d api
docker compose -f docker-compose.prod.yml ps
