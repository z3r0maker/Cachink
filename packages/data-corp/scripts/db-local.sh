#!/usr/bin/env bash
# The corp schema on the LOCAL Postgres that data-pg's db-local.sh runs
# (ADR-124 §2). Same container, same overrides (XG_PG_NAME / XG_PG_PORT), its
# own migration set: local/ first (the corp logins), then drizzle/ in order.
#
#   ./scripts/db-local.sh apply      # apply the corp set (after data-pg's `up`)
#   ./scripts/db-local.sh url        # xangarro_corp — the console's CORP_DATABASE_URL
#   ./scripts/db-local.sh agent-url  # xangarro_corp_agent — the agents' read-only login
#   ./scripts/db-local.sh super-url  # postgres, for fixtures
#   ./scripts/db-local.sh admin-url  # xangarro_admin, to prove it cannot read corp
#   ./scripts/db-local.sh app-url    # xangarro_app (the portal), likewise
#
# Like data-pg's `up`, `apply` is for a fresh database: drizzle/0000 holds bare
# CREATE TABLEs. Locally, reset with data-pg's db:reset and apply again.
set -euo pipefail

PORT="${XG_PG_PORT:-55432}"
DB=xangarro
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

apply_sql() {
  local single
  for f in "$HERE"/local/*.sql "$HERE"/drizzle/*.sql; do
    [ -e "$f" ] || continue
    single=--single-transaction
    [ "$(head -n 1 "$f" | tr -d '[:space:]')" = '--xangarro:no-transaction' ] && single=
    PGPASSWORD=xangarro PGOPTIONS='-c client_min_messages=warning' \
      psql -q -h localhost -p "$PORT" -U postgres -d "$DB" \
      -v ON_ERROR_STOP=1 $single -f "$f" >/dev/null
  done
}

case "${1:-apply}" in
  apply) apply_sql; echo "corp applied on port $PORT" ;;
  url) echo "postgres://xangarro_corp:xangarro_corp@localhost:${PORT}/${DB}" ;;
  agent-url) echo "postgres://xangarro_corp_agent:xangarro_corp_agent@localhost:${PORT}/${DB}" ;;
  super-url) echo "postgres://postgres:xangarro@localhost:${PORT}/${DB}" ;;
  admin-url) echo "postgres://xangarro_admin:xangarro_admin@localhost:${PORT}/${DB}" ;;
  app-url) echo "postgres://xangarro_app:xangarro_app@localhost:${PORT}/${DB}" ;;
  *) echo "usage: $0 {apply|url|agent-url|super-url|admin-url|app-url}" >&2; exit 1 ;;
esac
