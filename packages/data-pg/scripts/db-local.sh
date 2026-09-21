#!/usr/bin/env bash
# Local Postgres for the drift and RLS suites.
#
# Supabase (B-01) is not required to develop against the real schema: a plain
# Postgres container is enough to apply the migrations and prove the policies.
# Supabase adds auth, storage and the hosted project; the SQL is the same.
#
#   ./scripts/db-local.sh up      # start, create, migrate
#   ./scripts/db-local.sh down    # remove the container
#   ./scripts/db-local.sh apply   # migrate a FRESH Postgres someone else
#                                 # started — CI's service container. Like
#                                 # `up`, it aborts against an already-migrated
#                                 # database; locally you want `db:reset`.
#   ./scripts/db-local.sh url     # print the app-role DATABASE_URL
#   ./scripts/db-local.sh billing-url  # the Stripe webhook's BILLING_DATABASE_URL
#   ./scripts/db-local.sh metering-url # the usage cron's METERING_DATABASE_URL
#
# `up` is NOT idempotent: `drizzle/0000_*.sql` has 25 bare `CREATE TABLE`s, so
# re-applying to a migrated database aborts under `ON_ERROR_STOP=1`. Use
# `pnpm db:reset` (down, up, seed) rather than re-running `up`. Do not "fix"
# this by guarding on table existence — that would silently stop applying newly
# added migrations, which is a worse bug in a script four suites depend on.
set -euo pipefail

# Overridable so concurrent sessions can run isolated stacks (two agents
# sharing the default container corrupt each other's e2e resets — found
# 2026-09-20). Defaults unchanged.
NAME="${XG_PG_NAME:-xangarro-pg}"
PORT="${XG_PG_PORT:-55432}"
DB=xangarro
SUPER_URL="postgres://postgres:xangarro@localhost:${PORT}/${DB}"
APP_URL="postgres://xangarro_app:xangarro_app@localhost:${PORT}/${DB}"
BILLING_URL="postgres://xangarro_billing:xangarro_billing@localhost:${PORT}/${DB}"
METERING_URL="postgres://xangarro_metering:xangarro_metering@localhost:${PORT}/${DB}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# `local/` before `drizzle/`: the compat layer creates the roles the migrations
# grant to. CI calls this against its own service container, so both sides run
# byte-identical SQL in the same order from one place (CLAUDE.md §2.3).
apply_sql() {
  for f in "$HERE"/local/*.sql "$HERE"/drizzle/*.sql; do
    [ -e "$f" ] || continue
    PGPASSWORD=xangarro PGOPTIONS='-c client_min_messages=warning' \
      psql -q -h localhost -p "$PORT" -U postgres -d "$DB" \
      -v ON_ERROR_STOP=1 -f "$f" >/dev/null
  done
}

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
    apply_sql
    echo "ready: $APP_URL"
    ;;
  apply) apply_sql; echo "applied: $APP_URL" ;;
  # `-v`: the postgres image declares an anonymous data volume. Without it,
  # every `down` orphans that volume, and `db:reset` runs `down` each time — a
  # few hundred resets filled Docker's disk until initdb itself failed with
  # "No space left on device". The volume is this container's throwaway data,
  # never anything worth keeping.
  down) docker rm -f -v "$NAME" >/dev/null 2>&1 || true; echo "removed $NAME" ;;
  url)  echo "$APP_URL" ;;
  super-url) echo "$SUPER_URL" ;;
  billing-url) echo "$BILLING_URL" ;;
  metering-url) echo "$METERING_URL" ;;
  *) echo "usage: $0 {up|apply|down|url|super-url|billing-url|metering-url}" >&2; exit 1 ;;
esac
