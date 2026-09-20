#!/usr/bin/env bash
# Reset the local Postgres and apply BOTH migration sets (data-pg + admin),
# the state the console's e2e suite needs. db-local's reset only knows the
# data-pg half; the admin migrations are psql'd in idempotent order.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"

pnpm --filter @xangarro/data-pg db:reset
SUPER="$(cd "$ROOT/packages/data-pg" && ./scripts/db-local.sh super-url)"
for f in "$ROOT"/apps/backoffice/src/server/db/migrations/*.sql; do
  psql "$SUPER" -q -f "$f"
done
echo "admin migrations applied"
