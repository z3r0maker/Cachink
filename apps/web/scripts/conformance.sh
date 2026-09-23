#!/usr/bin/env bash
# Run the contract's conformance suite against THIS portal, not the mock.
#
# `packages/contracts/tests/conformance/` was written to run against either the
# mock or a real backend (`API_BASE`). This is the second mode: it builds nothing,
# starts the already-built portal, mints fresh single-use codes with the portal's
# own minter, and points the suite at it. The same assertions that pass against
# the mock must pass here, or the portal does not implement the contract.
#
# The Ed25519 key is the contract's published *test* key
# (`packages/contracts/src/mock/dev-keys.json`), passed explicitly. The portal
# has no default for it on purpose — see server/device/credentials.ts.
#
#   pnpm --filter @xangarro/data-pg db:reset && pnpm --filter @xangarro/web build
#   pnpm --filter @xangarro/web test:conformance
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
PORT="${CONFORMANCE_PORT:-3200}"
KEYS="$REPO/packages/contracts/src/mock/dev-keys.json"

DATABASE_URL="${DATABASE_URL:-$("$REPO/packages/data-pg/scripts/db-local.sh" url)}"
PRIV="$(node -e "console.log(require('$KEYS').privateHex)")"
PUB="$(node -e "console.log(require('$KEYS').publicHex)")"

cd "$HERE"
DATABASE_URL="$DATABASE_URL" \
  DEVICE_TOKEN_SECRET="${DEVICE_TOKEN_SECRET:-conformance-only}" \
  ENTITLEMENT_PRIVATE_KEY="$PRIV" \
  NODE_ENV=production PORT="$PORT" \
  npx next start >/tmp/xangarro-conformance-server.log 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT

for _ in $(seq 1 60); do
  curl -sf -o /dev/null "http://localhost:$PORT/login" && break
  sleep 1
done

# One minting per suite: vitest isolates each file, so two files would both
# start from the top of a shared list and the second would redeem spent codes.
suite() {
  local codes tokens
  codes="$(cd "$HERE" && DATABASE_URL="$DATABASE_URL" npx tsx scripts/conformance-codes.ts 8)"
  tokens="$(cd "$HERE" && DATABASE_URL="$DATABASE_URL" npx tsx scripts/conformance-codes.ts 3 --qr)"
  (cd "$REPO/packages/contracts" &&
    API_BASE="http://localhost:$PORT" \
      CONFORMANCE_EMAIL="conformance@xangarro.mx" \
      CONFORMANCE_CODES="$codes" \
      CONFORMANCE_QR_TOKENS="$tokens" \
      ENTITLEMENT_PUBKEY="$PUB" \
      npx vitest run "$@")
}

suite tests/conformance/activate.test.ts
suite tests/conformance/activate-scan.test.ts
suite tests/conformance/sync.test.ts

# B-18's other acceptance, on the log this very run produced: every push wrote
# one structured line with its counts, and no email reached the log at all.
LOG=/tmp/xangarro-conformance-server.log
grep -Eq '"evt":"api".*"endpoint":"sync/push".*"accepted":[0-9]+' "$LOG" ||
  { echo "conformance: no structured sync/push log line in $LOG" >&2; exit 1; }
if grep -q 'conformance@xangarro.mx' "$LOG"; then
  echo "conformance: an email reached the server log ($LOG)" >&2
  exit 1
fi
