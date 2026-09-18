#!/usr/bin/env bash
# Self-test for `db:migrate:hosted` against a THROWAWAY container (B-01).
#
#   pnpm --filter @xangarro/data-pg db:migrate:hosted:selftest
#
# Starts postgres:17-alpine on a spare port, shapes it like a fresh Supabase
# project (selftest-sim.sql), and proves on a copy of the migration tree:
#   1. --dry-run lists every file and writes nothing;
#   2. a fresh run creates the roles and applies everything;
#   3. the roles log in with their passwords (SCRAM) and carry the timeouts;
#   4. a second run applies nothing;
#   5. a new file is applied, alone;
#   6. an edited applied file (checksum drift) aborts with an error.
# The container and the copy are removed on exit, pass or fail. Never points
# at anything but localhost.
set -euo pipefail

NAME=xangarro-mig-selftest
PORT=55499
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG="$(cd "$HERE/../.." && pwd)"
REPO="$(cd "$PKG/../.." && pwd)"
TREE="$(mktemp -d)"
LOG="$TREE/run.log"

cleanup() { docker rm -f -v "$NAME" >/dev/null 2>&1 || true; rm -rf "$TREE"; }
trap cleanup EXIT

fail() { echo "FAIL: $1" >&2; echo "--- last output ---" >&2; cat "$LOG" >&2; exit 1; }

docker rm -f -v "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -e POSTGRES_USER=supabase_admin -e POSTGRES_PASSWORD=selftest \
  -e POSTGRES_DB=postgres -p "${PORT}:5432" postgres:17-alpine >/dev/null
for _ in $(seq 1 60); do
  docker exec "$NAME" pg_isready -U supabase_admin -d postgres >/dev/null 2>&1 && break
  sleep 1
done
sleep 1
docker exec -i "$NAME" psql -q -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
  <"$HERE/selftest-sim.sql" >/dev/null

for dir in packages/data-pg/hosted packages/data-pg/drizzle apps/admin/src/server/db/migrations; do
  mkdir -p "$TREE/$dir" && cp "$REPO/$dir"/*.sql "$TREE/$dir/"
done
TOTAL=$(ls "$TREE"/packages/data-pg/hosted/*.sql "$TREE"/packages/data-pg/drizzle/*.sql \
  "$TREE"/apps/admin/src/server/db/migrations/*.sql | wc -l | tr -d ' ')

export SUPERUSER_URL="postgres://postgres:selftest@localhost:${PORT}/postgres"
APP_PW="$(openssl rand -base64 32)"
export XANGARRO_APP_PASSWORD="$APP_PW"
export XANGARRO_BILLING_PASSWORD="$(openssl rand -base64 32)"
export XANGARRO_METERING_PASSWORD="$(openssl rand -base64 32)"
export XANGARRO_ADMIN_PASSWORD="$(openssl rand -base64 32)"

# SELFTEST_VERBOSE=1 echoes every run's output.
migrate() {
  local rc=0
  (cd "$PKG" && pnpm exec tsx ./scripts/migrate-hosted.ts --root "$TREE" "$@") >"$LOG" 2>&1 || rc=$?
  if [ "${SELFTEST_VERBOSE:-}" = 1 ]; then sed 's/^/    | /' "$LOG"; fi
  return "$rc"
}
# Through the published port, so the container's trust rule for 127.0.0.1 does
# not apply and a password is really checked.
psql_as() { PGPASSWORD="$2" psql -h localhost -p "$PORT" -U "$1" -d postgres -tAc "$3"; }

migrate --dry-run || fail "dry run exited non-zero"
grep -q "^${TOTAL} migration(s) would run." "$LOG" || fail "dry run should list all ${TOTAL} files"
[ "$(psql_as postgres selftest "SELECT to_regclass('xangarro_ops.migrations') IS NULL")" = t ] ||
  fail "dry run wrote the ledger"
echo "ok  dry run lists ${TOTAL} files, writes nothing"

migrate || fail "fresh run exited non-zero"
grep -q "^${TOTAL} migration(s) applied." "$LOG" || fail "fresh run should apply ${TOTAL} files"
grep -q "^created   role xangarro_app" "$LOG" || fail "fresh run should create xangarro_app"
echo "ok  fresh run applies ${TOTAL} files"
grep "^WARNING" "$LOG" | sed 's/^/    /' || true

[ "$(psql_as xangarro_app "$APP_PW" 'SHOW statement_timeout')" = 5s ] ||
  fail "xangarro_app cannot log in or has no 5s statement_timeout"
[ "$(psql_as xangarro_app "$APP_PW" 'SELECT count(*) FROM public.businesses')" = 0 ] ||
  fail "xangarro_app cannot read businesses"
psql_as xangarro_app wrong-password 'SELECT 1' >/dev/null 2>&1 && fail "a wrong password logged in"
echo "ok  roles log in with SCRAM passwords and carry their timeouts"

migrate || fail "second run exited non-zero"
grep -q "^0 migration(s) applied." "$LOG" || fail "second run should apply nothing"
echo "ok  second run applies nothing"

echo "CREATE TABLE public.selftest_probe (id int PRIMARY KEY);" \
  >"$TREE/packages/data-pg/drizzle/9999_selftest_probe.sql"
migrate || fail "run with a new file exited non-zero"
grep -q "^applied   data-pg/9999_selftest_probe.sql" "$LOG" && grep -q "^1 migration(s) applied." "$LOG" ||
  fail "the new file should be applied alone"
echo "ok  a new file is applied alone"

BAD="$TREE/packages/data-pg/drizzle/9999_selftest_zbad.sql"
echo "CREATE TABLE public.selftest_bad (id int); SELECT 1 / 0;" >"$BAD"
migrate && fail "a failing file should abort the run"
grep -q "9999_selftest_zbad.sql failed and was rolled back" "$LOG" || fail "the failure should name the file"
[ "$(psql_as postgres selftest "SELECT to_regclass('public.selftest_bad') IS NULL
  AND NOT EXISTS (SELECT 1 FROM xangarro_ops.migrations WHERE name LIKE '%zbad%')")" = t ] ||
  fail "a failed file left a table or a ledger row behind"
rm "$BAD"
echo "ok  a failing file rolls back whole, ledger untouched"

docker exec "$NAME" psql -q -U supabase_admin -d postgres -c 'ALTER ROLE postgres NOBYPASSRLS' >/dev/null
migrate --dry-run && fail "a dry run with a blocker should exit non-zero"
grep -q "^BLOCKER   postgres has no BYPASSRLS" "$LOG" && grep -q "fix:    ALTER ROLE postgres BYPASSRLS" "$LOG" ||
  fail "the dry run should name the BYPASSRLS blocker and its fix"
migrate && fail "a real run with a blocker should refuse"
grep -q "nothing was written" "$LOG" || fail "a blocked run should say nothing was written"
docker exec "$NAME" psql -q -U supabase_admin -d postgres -c 'ALTER ROLE postgres BYPASSRLS' >/dev/null
echo "ok  preflight blockers show in the dry run and stop the real run"

FIRST="$(ls "$TREE"/packages/data-pg/drizzle/*.sql | head -1)"
echo "-- drift" >>"$FIRST"
migrate && fail "checksum drift should abort"
grep -q "changed after it was applied" "$LOG" || fail "drift should name the changed file"
echo "ok  checksum drift aborts"
echo "PASS"
