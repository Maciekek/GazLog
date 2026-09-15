#!/usr/bin/env sh
# Pull the newest image and restart only if it changed. Safe to run from cron.
set -eu
cd "$(dirname "$0")"
docker compose pull -q
docker compose up -d --remove-orphans
docker image prune -f >/dev/null
