#!/usr/bin/env bash
# -------------------------------------------------------------------
# fold-tour.sh — run every screen tour on ONE device and fold-audit each.
#
#   fold-tour.sh --device-class se|iphone|ipad [--out <dir>]
#
# Each flows/internal/tour-*.yaml navigates to a single screen and stops;
# this script probes that screen for below-the-fold content. Running it on
# two device classes and diffing the results answers the actual question:
# "which controls are reachable on iPad but hidden on a phone?"
#
# Tours rather than feature flows on purpose: a feature flow that fails
# halfway leaves the app on an arbitrary screen, which makes a cross-device
# comparison meaningless.
#
# Precondition: demo data seeded on the target device.
# -------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FLOWS_DIR="$(cd "$SCRIPT_DIR/../flows" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

DEVICE_CLASS=""
OUT_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --device-class) DEVICE_CLASS="$2"; shift 2 ;;
    --out)          OUT_DIR="$2";      shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done
[[ -n "$DEVICE_CLASS" ]] || { echo "usage: fold-tour.sh --device-class se|iphone|ipad" >&2; exit 1; }

# shellcheck source=lib/device-resolve.sh
source "$SCRIPT_DIR/lib/device-resolve.sh"
# shellcheck source=lib/with-timeout.sh
source "$SCRIPT_DIR/lib/with-timeout.sh"

resolve_device "$DEVICE_CLASS"
OUT_DIR="${OUT_DIR:-$REPO_ROOT/e2e-reports/fold-tours/$DEVICE_CLASS}"
mkdir -p "$OUT_DIR"

echo "🕳️  Fold tour — device class: $DEVICE_CLASS ($MAESTRO_DEVICE_UDID)"
echo "    output: $OUT_DIR"

PASSED=0; FAILED=0; AUDITED=0

for tour in "$FLOWS_DIR"/internal/tour-*.yaml; do
  name="$(basename "$tour" .yaml)"; name="${name#tour-}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🧭  $name"

  rc=0
  with_timeout 180 maestro --device "$MAESTRO_DEVICE_UDID" test "$tour" \
    >"$OUT_DIR/$name.log" 2>&1 || rc=$?

  if [[ $rc -ne 0 ]]; then
    echo "  ❌  tour failed (rc=$rc) — screen not reached, skipping audit"
    FAILED=$((FAILED + 1))
    # A timeout usually means a dead driver; recover before the next tour.
    [[ $rc -eq 124 ]] && kill_maestro_driver
    continue
  fi
  PASSED=$((PASSED + 1))

  mkdir -p "$OUT_DIR/$name"
  FOLD_AUDIT=1 "$SCRIPT_DIR/fold-audit.sh" "$tour" "$OUT_DIR/$name" || true
  [[ -f "$OUT_DIR/$name/fold-audit.json" ]] && AUDITED=$((AUDITED + 1))
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊  Fold tour ($DEVICE_CLASS): $PASSED reached, $FAILED unreachable, $AUDITED audited"
echo "    $OUT_DIR"
