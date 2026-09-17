#!/usr/bin/env bash
# -------------------------------------------------------------------
# entry-setup.sh — shared entry-point detection + state setup.
#
# Sourced by both run-flow.sh and full-regression.sh so the two runners
# share ONE implementation of "read a flow's x-entrypoint and put the app
# into the right state (fresh / activated), caching the current state so
# consecutive same-entry flows don't re-activate".
#
# Entry points (A-16):
#   fresh     — mock reset + local DB deleted; the app boots at activation.
#   activated — fresh + activation.yaml: the device holds the mock business
#               (Tacos La Esquina, operators Toni 123456 / Ana 567890,
#               28 products, 3 clients). Flows sign in with
#               shared/login-operator.yaml.
#   demo, wizard — retired first-run entries; treated as `activated`.
#
# Provides: detect_entry <flow>, current_state, run_setup <entry>.
# Honors (with defaults): SKIP_SETUP, MAESTRO_DEVICE_UDID, STATE_FILE.
# -------------------------------------------------------------------

# Resolve paths from this lib's location (scripts/lib/entry-setup.sh) unless the
# sourcing script already set them.
_ENTRY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_DIR="${SCRIPT_DIR:-$(cd "$_ENTRY_LIB_DIR/.." && pwd)}"
FLOWS_DIR="${FLOWS_DIR:-$(cd "$SCRIPT_DIR/../flows" && pwd)}"
FRESH_SCRIPT="${FRESH_SCRIPT:-$SCRIPT_DIR/fresh-install.sh}"
ACTIVATION_FLOW="${ACTIVATION_FLOW:-$FLOWS_DIR/activation.yaml}"
MOCK_API="${MOCK_API:-http://127.0.0.1:3100}"
STATE_FILE="${STATE_FILE:-/tmp/maestro-entry-state}"
APP_ID="${APP_ID:-mx.xangarro.mobile}"

# ──────────── Entry point detection ───────────────────────────────
# Prefer structured `# x-entrypoint:` metadata; fall back to a
# `# Precondition:` comment; default to wizard.
#
# Scans the whole YAML front matter (everything before the `---`
# separator), NOT a fixed line count.
#
# This used to be `head -15`, which silently mis-bucketed every flow whose
# header comment ran long: 13 flows declare `# x-entrypoint: demo` on lines
# 16-18 (stock-buscar, stock-kpi-strip, empty-egresos, validation-egreso,
# editar-egreso-full-form, …). They fell through to the `wizard` default,
# so they were set up WITHOUT demo data — no Ana Operativa, no demo
# products — and failed every run, ~11% of the suite. The failure looked
# like a flaky app bug rather than a setup mis-classification.
_flow_header() {
  # Front matter only; stop at the first `---`. Falls back to the whole
  # file if a flow somehow has no separator.
  sed -n '1,/^---[[:space:]]*$/p' "$1" 2>/dev/null
}

detect_entry() {
  local flow="$1"
  local xentry
  xentry=$(_flow_header "$flow" | sed -n 's/^# x-entrypoint: \([a-z]*\).*/\1/p' 2>/dev/null | head -1)
  if [[ "$xentry" == demo || "$xentry" == wizard ]]; then echo "activated"; return; fi
  if [[ -n "$xentry" ]]; then echo "$xentry"; return; fi

  local precondition
  precondition=$(_flow_header "$flow" | grep -i '# Precondition:' 2>/dev/null | head -1 || true)
  if echo "$precondition" | grep -qi 'fresh install'; then echo "fresh"
  else echo "activated"; fi
}

current_state() {
  if [[ -f "$STATE_FILE" ]]; then cat "$STATE_FILE"; else echo "none"; fi
}

# Mock back to its fixtures, local DB deleted, cold start on Metro. The
# device token in the keychain survives, but without the activation record
# (in the DB) the app boots at the activation screen.
_fresh_device() {
  if ! curl -sf -X POST "$MOCK_API/__mock/reset" >/dev/null; then
    echo "❌  Mock API not reachable at $MOCK_API — start it: PORT=3100 pnpm mock:api"
    return 1
  fi
  "$FRESH_SCRIPT" --reset-only
  local sim_target="${MAESTRO_DEVICE_UDID:-booted}"
  local dev_url="exp+xangarro://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"
  xcrun simctl terminate "$sim_target" "$APP_ID" 2>/dev/null || true
  xcrun simctl openurl "$sim_target" "$dev_url" 2>/dev/null || true
  sleep 20
}

# Terminate and relaunch the app on Metro so a flow starts from the operator
# list instead of wherever the previous flow left it. Data is untouched.
cold_start_app() {
  local sim_target="${MAESTRO_DEVICE_UDID:-booted}"
  xcrun simctl terminate "$sim_target" "$APP_ID" 2>/dev/null || true
  xcrun simctl openurl "$sim_target" \
    "exp+xangarro://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" 2>/dev/null || true
  sleep "${COLD_START_WAIT:-18}"
}

# ──────────── Setup runner (state-cached) ─────────────────────────
run_setup() {
  local entry="$1"
  local prev; prev=$(current_state)

  if [[ "${SKIP_SETUP:-false}" == true ]]; then
    echo "⏭️   Skipping setup (--skip-setup)"
    return 0
  fi
  # `fresh` is never reused: its flows (activation) change the state they start from.
  if [[ "$prev" == "$entry" && "$entry" != fresh ]]; then
    echo "♻️   State already '$entry' — skipping setup"
    return 0
  fi

  echo "🔧  Setting up entry point: $entry"
  case "$entry" in
    fresh | activated)
      _fresh_device
      if [[ "$entry" == activated ]]; then
        echo "🔑  Activating against the mock ($MOCK_API)..."
        maestro test ${MAESTRO_DEVICE_UDID:+--device "$MAESTRO_DEVICE_UDID"} "$ACTIVATION_FLOW"
      fi
      ;;
    *)
      echo "❌  Unknown entry point: $entry"
      return 1
      ;;
  esac

  echo "$entry" > "$STATE_FILE"
  echo "✅  Setup complete ($entry)"
}
