#!/usr/bin/env bash
# q.sh <tenant> <label> <sql> : EXPLAIN ANALYZE as xangarro_app with the tenant claim, warm (2nd run), print time + rows
T=$1; L=$2; Q=$3
run() { PGPASSWORD=xangarro_app psql -h localhost -p 55498 -U xangarro_app -d xangarro -At -v ON_ERROR_STOP=1 <<SQL
BEGIN;
SET LOCAL statement_timeout = '${TIMEOUT:-120s}';
SELECT set_config('request.jwt.claims', '{"business_id":"$T","role":"authenticated"}', true) \gset
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) $Q;
ROLLBACK;
SQL
}
run >/dev/null 2>&1; out=$(run 2>&1)
echo "$out" | python3 "$(dirname "$0")/parse.py" "$L"
