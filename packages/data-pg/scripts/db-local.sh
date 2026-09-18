#!/usr/bin/env bash
# Local Postgres for the drift and RLS suites.
#
# Supabase (B-01) is not required to develop against the real schema: a plain
# Postgres container is enough to apply the migrations and prove the policies.
# Supabase adds auth, storage and the hosted project; the SQL is the same.
#
#   ./scripts/db-local.sh up      # start, create, migrate
#   ./scripts/db-local.sh down    # remove the container
#   ./scripts/db-local.sh url     # print the app-role DATABASE_URL
set -euo pipefail

NAME=xangarro-pg
PORT=55432
DB=xangarro
SUPER_URL="postgres://postgres:xangarro@localhost:${PORT}/${DB}"
APP_URL="postgres://xangarro_app:xangarro_app@localhost:${PORT}/${DB}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "${1:-up}" in
  up)
    if ! docker inspect "$NAME" >/dev/null 2>&1; then
      docker run -d --name "$NAME" \
        -e POSTGRES_PASSWORD=xangarro -e POSTGRES_DB="$DB" \
        -p "${PORT}:5432" postgres:17-alpine >/dev/null
    else
      docker start "$NAME" >/dev/null
    fi
    for _ in $(seq 1 60); do
      docker exec "$NAME" pg_isready -U postgres >/dev/null 2>&1 && break
      sleep 1
    done
    for f in "$HERE"/drizzle/*.sql; do
      PGPASSWORD=xangarro PGOPTIONS='-c client_min_messages=warning' \
        psql -q -h localhost -p "$PORT" -U postgres -d "$DB" \
        -v ON_ERROR_STOP=1 -f "$f" >/dev/null
    done
    echo "ready: $APP_URL"
    ;;
  down) docker rm -f "$NAME" >/dev/null 2>&1 || true; echo "removed $NAME" ;;
  url)  echo "$APP_URL" ;;
  super-url) echo "$SUPER_URL" ;;
  *) echo "usage: $0 {up|down|url|super-url}" >&2; exit 1 ;;
esac
