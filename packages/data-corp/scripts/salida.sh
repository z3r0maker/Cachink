#!/usr/bin/env bash
# E-44 «Salida a otro sistema»: the database half of moving the corp schema to
# another Postgres (ADR-125 §2). The runbook, with the order, the files' half
# and the rollback, is docs/ops/empresa-lift-out.md.
#
#   salida.sh congelar    <source-url>        # corp logins off, their sessions ended
#   salida.sh descongelar <source-url>        # rollback only: the logins back on
#   salida.sh exportar    <source-url> <dir>  # dump, fingerprints, grants, ledger
#   salida.sh importar    <dir> <target-url>  # roles, restore, grants, ledger: one transaction
#   salida.sh verificar   <dir> <target-url>  # every check; exits 1 on any difference
#
# Each URL is the database owner (`postgres`) on a SESSION connection, never a
# transaction pooler. URLs are arguments, never printed: a password stays in
# the operator's shell history at worst, never in this script's output.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL="$HERE/salida"
MIGRATIONS="$HERE/../drizzle"
ROLES="'xangarro_corp', 'xangarro_corp_agent'"
EXPORT_FILES="corp.dump huellas.txt permisos.sql esquema.sql ledger.csv"
# The corp rows of the hosted migration ledger, with applied_at as UTC text so
# both ends print the same line whatever their session's time zone.
LEDGER_ROWS="COPY (SELECT name, checksum, to_char(applied_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')
  FROM xangarro_ops.migrations WHERE name LIKE 'corp/%' ORDER BY applied_at, name) TO STDOUT WITH (FORMAT csv)"

die() { echo "salida: $*" >&2; exit 1; }

q() {
  local url=$1
  shift
  psql "$url" -X -q -At -v ON_ERROR_STOP=1 "$@"
}

# The schema's DDL without the lines that differ between two healthy dumps:
# the server and client versions, and pg_dump's random \restrict key.
esquema() {
  pg_dump "$1" --schema-only --schema=corp --no-owner --no-privileges |
    grep -vE '^(\\(un)?restrict |-- Dumped (from|by) )'
}

congelar() {
  local ended
  ended=$(q "$1" <<SQL
ALTER ROLE xangarro_corp NOLOGIN;
ALTER ROLE xangarro_corp_agent NOLOGIN;
SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE usename IN ($ROLES);
SQL
)
  echo "frozen: the corp logins are off, $ended session(s) ended"
}

descongelar() {
  q "$1" -c 'ALTER ROLE xangarro_corp LOGIN' -c 'ALTER ROLE xangarro_corp_agent LOGIN'
  echo "thawed: the corp logins are back on the source"
}

exportar() {
  local src=$1 dir=$2
  if [ -d "$dir" ] && [ -n "$(ls -A "$dir")" ]; then die "$dir is not empty"; fi
  [ "$(q "$src" -c "SELECT rolcanlogin FROM pg_roles WHERE rolname = 'xangarro_corp'")" = f ] ||
    die "xangarro_corp can still log in: run congelar first"
  [ "$(q "$src" -c "SELECT count(*) FROM pg_stat_activity WHERE usename IN ($ROLES)")" = 0 ] ||
    die "a corp session is still open: run congelar again"
  mkdir -p "$dir"
  pg_dump "$src" --format=custom --schema=corp --no-owner --no-privileges --file="$dir/corp.dump"
  q "$src" -F '|' -f "$SQL/huellas.sql" >"$dir/huellas.txt"
  q "$src" -f "$SQL/permisos.sql" >"$dir/permisos.sql"
  esquema "$src" >"$dir/esquema.sql"
  if [ "$(q "$src" -c "SELECT to_regclass('xangarro_ops.migrations') IS NOT NULL")" = t ]; then
    q "$src" -c "$LEDGER_ROWS" >"$dir/ledger.csv"
  else
    : >"$dir/ledger.csv"
  fi
  (cd "$dir" && shasum -a 256 $EXPORT_FILES >SHA256SUMS)
  echo "exported $(wc -l <"$dir/huellas.txt" | tr -d ' ') tables, $(wc -l <"$dir/ledger.csv" | tr -d ' ') ledger rows to $dir"
}

# One transaction: the target ends with all of corp or with none of it.
importar() {
  local dir=$1 dst=$2
  (cd "$dir" && shasum -a 256 -c --quiet SHA256SUMS) || die "the export in $dir is damaged or incomplete"
  [ "$(q "$dst" -c "SELECT to_regnamespace('corp') IS NULL")" = t ] ||
    die "the target already has a corp schema: importar runs once, on a target without it"
  {
    cat "$SQL/roles.sql"
    pg_restore --no-owner --no-privileges --file=- "$dir/corp.dump"
    cat "$dir/permisos.sql" "$SQL/ledger.sql"
    echo 'COPY xangarro_ops.migrations (name, checksum, applied_at) FROM STDIN WITH (FORMAT csv);'
    cat "$dir/ledger.csv"
    echo '\.'
  } | q "$dst" --single-transaction -f -
  echo "imported corp into the target; next: salida.sh verificar $dir <target-url>"
}

FAILURES=0
pass() { echo "ok    $1"; }
fail() {
  echo "FAIL  $1"
  FAILURES=$((FAILURES + 1))
}

# label, the export's file, then the command whose output must equal it.
same() {
  local label=$1 expected=$2 actual
  shift 2
  actual=$("$@")
  if [ "$actual" = "$(cat "$expected")" ]; then pass "$label"; else
    fail "$label"
    diff "$expected" <(printf '%s\n' "$actual") | head -20 | sed 's/^/      /' || true
  fi
}

# The target's corp ledger rows equal the source's, and each names a file of
# this checkout with the same bytes. Check out the deployed commit first.
ledger() {
  local dir=$1 dst=$2 name sum file bad=0
  if [ ! -s "$dir/ledger.csv" ]; then
    echo "info  no migration ledger at the source (a local database applies with psql)"
    return
  fi
  same "ledger rows" "$dir/ledger.csv" q "$dst" -c "$LEDGER_ROWS"
  while IFS=, read -r name sum _; do
    file="$MIGRATIONS/${name#corp/}"
    if [ ! -f "$file" ] || [ "$(shasum -a 256 "$file" | cut -d' ' -f1)" != "$sum" ]; then
      echo "      $name is not this checkout's file"
      bad=1
    fi
  done <"$dir/ledger.csv"
  if [ "$bad" = 0 ]; then pass "ledger matches this checkout's migrations"; else fail "ledger matches this checkout's migrations"; fi
}

verificar() {
  local dir=$1 dst=$2 problems azure
  (cd "$dir" && shasum -a 256 -c --quiet SHA256SUMS) || die "the export in $dir is damaged or incomplete"
  same "every row of every table" "$dir/huellas.txt" q "$dst" -F '|' -f "$SQL/huellas.sql"
  same "tables, constraints, triggers and functions" "$dir/esquema.sql" esquema "$dst"
  same "the two roles' grants" "$dir/permisos.sql" q "$dst" -f "$SQL/permisos.sql"
  problems=$(q "$dst" -f "$SQL/ajenos.sql")
  if [ -z "$problems" ]; then pass "no other role can read corp"; else
    fail "no other role can read corp"
    echo "$problems" | sed 's/^/      /'
  fi
  problems=$(q "$dst" -f "$SQL/documentos.sql")
  if [ -z "$problems" ]; then pass "every file in corp.blobs matches its SHA-256"; else
    fail "every file in corp.blobs matches its SHA-256"
    echo "$problems" | sed 's/^/      /'
  fi
  azure=$(q "$dst" -c "SELECT count(*) FROM corp.documents WHERE storage = 'azure'")
  [ "$azure" = 0 ] || echo "info  $azure file(s) live in Azure: the runbook's container step checks them"
  ledger "$dir" "$dst"
  if [ "$FAILURES" -gt 0 ]; then die "$FAILURES check(s) failed: do not cut over"; fi
  echo "verified: the target holds the source's corp"
}

case "${1:-}" in
  congelar) [ $# -eq 2 ] || die "usage: $0 congelar <source-url>"; congelar "$2" ;;
  descongelar) [ $# -eq 2 ] || die "usage: $0 descongelar <source-url>"; descongelar "$2" ;;
  exportar) [ $# -eq 3 ] || die "usage: $0 exportar <source-url> <dir>"; exportar "$2" "$3" ;;
  importar) [ $# -eq 3 ] || die "usage: $0 importar <dir> <target-url>"; importar "$2" "$3" ;;
  verificar) [ $# -eq 3 ] || die "usage: $0 verificar <dir> <target-url>"; verificar "$2" "$3" ;;
  *) die "usage: $0 {congelar|descongelar|exportar|importar|verificar} …" ;;
esac
