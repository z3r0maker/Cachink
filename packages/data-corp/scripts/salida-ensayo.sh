#!/usr/bin/env bash
# E-44's rehearsal: the database half of the lift-out (salida.sh), from the
# local corp to a throwaway Postgres, then every kind of damage `verificar`
# must catch. Run it after the Empresa e2e has filled the local corp:
#
#   XG_PG_NAME=… XG_PG_PORT=… pnpm --filter @xangarro/backoffice test:e2e:db e2e/empresa.spec.ts
#   XG_PG_PORT=… ./scripts/salida-ensayo.sh
#
# The target is its own container (XG_SALIDA_NAME / XG_SALIDA_PORT), removed
# at the end with its volume. The source is frozen during the run and thawed
# after; a migration ledger is faked on it when it has none, as the hosted
# runner would have left one, and dropped again.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SALIDA="$HERE/salida.sh"
SRC="$("$HERE/db-local.sh" super-url)"
NAME="${XG_SALIDA_NAME:-xangarro-pg-salida}"
PORT="${XG_SALIDA_PORT:-55441}"
DST="postgres://postgres:xangarro@localhost:${PORT}/mexia"
WORK="$(mktemp -d)"
LEDGER_MADE=0

sql() { psql "$1" -X -q -At -v ON_ERROR_STOP=1 -c "$2"; }
die() { echo "ensayo: $*" >&2; exit 1; }

cleanup() {
  "$SALIDA" descongelar "$SRC" >/dev/null 2>&1 || true
  if [ "$LEDGER_MADE" = 1 ]; then sql "$SRC" 'SET client_min_messages = warning; DROP SCHEMA xangarro_ops CASCADE' || true; fi
  docker rm -f -v "$NAME" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

# What a hosted source has and a local one lacks: the runner's ledger rows.
fake_ledger() {
  [ "$(sql "$SRC" "SELECT to_regclass('xangarro_ops.migrations') IS NULL")" = t ] || return 0
  psql "$SRC" -X -q -v ON_ERROR_STOP=1 -f "$HERE/salida/ledger.sql"
  LEDGER_MADE=1
  for f in "$HERE"/../drizzle/*.sql; do
    sql "$SRC" "INSERT INTO xangarro_ops.migrations (name, checksum)
                VALUES ('corp/$(basename "$f")', '$(shasum -a 256 "$f" | cut -d' ' -f1)')"
  done
}

start_target() {
  docker rm -f -v "$NAME" >/dev/null 2>&1 || true
  docker run -d --name "$NAME" -e POSTGRES_PASSWORD=xangarro -e POSTGRES_DB=mexia \
    -p "${PORT}:5432" postgres:17-alpine >/dev/null
  for _ in $(seq 1 60); do
    sql "$DST" 'SELECT 1' >/dev/null 2>&1 && return 0
    sleep 1
  done
  die "the target container never came up"
}

# tamper SQL, the FAIL label verificar must print, the SQL that undoes it.
expect_caught() {
  local label=$1 tamper=$2 undo=$3 out
  sql "$DST" "$tamper"
  if out=$("$SALIDA" verificar "$WORK/export" "$DST" 2>&1); then die "verificar missed: $label"; fi
  echo "$out" | grep -qF "FAIL  $label" || { echo "$out"; die "verificar failed, but not on: $label"; }
  sql "$DST" "$undo"
  echo "caught  $label"
}

[ "$(sql "$SRC" 'SELECT count(*) > 0 FROM corp.documents')" = t ] &&
  [ "$(sql "$SRC" 'SELECT count(*) > 0 FROM corp.entries')" = t ] ||
  die "the local corp is empty: run the Empresa e2e first"

fake_ledger
start_target
"$SALIDA" congelar "$SRC"
"$SALIDA" exportar "$SRC" "$WORK/export"
"$SALIDA" importar "$WORK/export" "$DST"
"$SALIDA" verificar "$WORK/export" "$DST"

if "$SALIDA" importar "$WORK/export" "$DST" >/dev/null 2>&1; then die "a second importar was let through"; fi
echo "refused a second importar"

# The roles work, not just exist: the console reads, the agent never sees bytes.
sql "$DST" "ALTER ROLE xangarro_corp LOGIN PASSWORD 'ensayo'; ALTER ROLE xangarro_corp_agent LOGIN PASSWORD 'ensayo'"
CORP="postgres://xangarro_corp:ensayo@localhost:${PORT}/mexia"
AGENT="postgres://xangarro_corp_agent:ensayo@localhost:${PORT}/mexia"
[ "$(sql "$CORP" 'SELECT count(*) FROM corp.entries')" = "$(sql "$SRC" 'SELECT count(*) FROM corp.entries')" ] ||
  die "xangarro_corp does not read the same entries"
sql "$AGENT" 'SELECT count(sha256) FROM corp.documents' >/dev/null
if sql "$AGENT" 'SELECT count(*) FROM corp.blobs' >/dev/null 2>&1; then die "the agent role reads file bytes"; fi
echo "the console role reads the books; the agent role reads metadata, never bytes"

expect_caught "every row of every table" \
  "UPDATE corp.founders SET nombre = nombre || '~' WHERE numero = 1" \
  "UPDATE corp.founders SET nombre = left(nombre, -1) WHERE numero = 1"
expect_caught "every file in corp.blobs matches its SHA-256" \
  "UPDATE corp.blobs SET content = content || '\\x00'::bytea WHERE key = (SELECT min(key) FROM corp.blobs)" \
  "UPDATE corp.blobs SET content = substring(content FROM 1 FOR octet_length(content) - 1) WHERE key = (SELECT min(key) FROM corp.blobs)"
expect_caught "the two roles' grants" \
  'REVOKE SELECT ON corp.blobs FROM xangarro_corp' 'GRANT SELECT ON corp.blobs TO xangarro_corp'
expect_caught "no other role can read corp" \
  'GRANT SELECT ON corp.entries TO PUBLIC' 'REVOKE SELECT ON corp.entries FROM PUBLIC'
expect_caught "tables, constraints, triggers and functions" \
  'ALTER TABLE corp.entries DISABLE TRIGGER entries_period_open' \
  'ALTER TABLE corp.entries ENABLE TRIGGER entries_period_open'
FIRST="$(sql "$DST" "SELECT name || '|' || checksum FROM xangarro_ops.migrations ORDER BY name LIMIT 1")"
expect_caught "ledger rows" \
  "UPDATE xangarro_ops.migrations SET checksum = repeat('0', 64) WHERE name = '${FIRST%%|*}'" \
  "UPDATE xangarro_ops.migrations SET checksum = '${FIRST#*|}' WHERE name = '${FIRST%%|*}'"

cp -R "$WORK/export" "$WORK/damaged"
echo 'x' >>"$WORK/damaged/huellas.txt"
if "$SALIDA" verificar "$WORK/damaged" "$DST" >/dev/null 2>&1; then die "a damaged export was trusted"; fi
echo "caught  a damaged export"

"$SALIDA" verificar "$WORK/export" "$DST" >/dev/null
echo "rehearsal passed: the target verifies again after every undo"
