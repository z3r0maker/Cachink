#!/usr/bin/env bash
# -------------------------------------------------------------------
# entry-setup.sh — shared entry-point detection + state setup.
#
# Sourced by both run-flow.sh and full-regression.sh so the two runners
# share ONE implementation of "read a flow's x-entrypoint and put the app
# into the right state (fresh / demo / wizard), caching the current state
# so consecutive same-entry flows don't re-seed".
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
DEMO_FLOW="${DEMO_FLOW:-$FLOWS_DIR/demo-mode-setup.yaml}"
WIZARD_FLOW="${WIZARD_FLOW:-$FLOWS_DIR/wizard-local-standalone.yaml}"
ACTIVATED_FLOW="${ACTIVATED_FLOW:-$FLOWS_DIR/shared/setup-activated.yaml}"
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
  if [[ -n "$xentry" ]]; then echo "$xentry"; return; fi

  local precondition
  precondition=$(_flow_header "$flow" | grep -i '# Precondition:' 2>/dev/null | head -1 || true)
  if [[ -z "$precondition" ]]; then echo "wizard"; return; fi

  if echo "$precondition" | grep -qi 'fresh install'; then echo "fresh"
  elif echo "$precondition" | grep -qi 'demo mode'; then echo "demo"
  else echo "wizard"; fi
}

current_state() {
  if [[ -f "$STATE_FILE" ]]; then cat "$STATE_FILE"; else echo "none"; fi
}

# ──────────── App reset (M-11, ported from feat/movil-maestro) ────
# Clean slate: no device token (keychain), no SQLite, the contracts mock
# back to its fixtures, then the dev-client is pointed at Metro and waits
# for the first screen (Vincular on fresh, the tab bar when activated).
MOCK_API="${MOCK_API:-http://127.0.0.1:3000}"
PRIME_FLOW="${PRIME_FLOW:-$FLOWS_DIR/shared/prime-dev-client.yaml}"

# Maestro sometimes hangs after an XCTest hiccup while the app is switching
# (kAXErrorInvalidUIElement): cap each setup run and retry. Terminating the
# app between tries clears the wedged UI element the driver chokes on.
_maestro_setup() {
  local flow="$1" try
  for try in 1 2 3; do
    perl -e 'alarm shift; exec @ARGV' 240 \
      maestro test ${MAESTRO_DEVICE_UDID:+--device "$MAESTRO_DEVICE_UDID"} "$flow" && return 0
    echo "⚠️   setup flow $(basename "$flow") failed (try $try)"
    pkill -f "maestro test" 2>/dev/null || true
    xcrun simctl terminate "${MAESTRO_DEVICE_UDID:-booted}" "$APP_ID" 2>/dev/null || true
    sleep 3
  done
  return 1
}

reset_app() {
  local sim_target="${MAESTRO_DEVICE_UDID:-booted}"
  xcrun simctl terminate "$sim_target" "$APP_ID" 2>/dev/null || true
  xcrun simctl keychain "$sim_target" reset 2>/dev/null || true
  # Cache-buster for the dev client's bundle URL: a cold start otherwise
  # serves the stale bundle cached on disk, and app-side fixes never reach
  # the phone (M-11). A fresh URL forces the reconnect to re-fetch.
  export BUNDLE_BUSTER="$(date +%s)"
  # Park the dev client's floating gear at the top-left (M-11): left to drift,
  # it eats taps on the header (the sync pill) and the checkout bar with no
  # trace in the accessibility tree — the handoff's «Tools button» gotcha.
  xcrun simctl spawn "$sim_target" defaults write "$APP_ID" DevMenuFAB.hasStoredPosition -bool YES 2>/dev/null || true
  xcrun simctl spawn "$sim_target" defaults write "$APP_ID" DevMenuFAB.positionX -float 40 2>/dev/null || true
  xcrun simctl spawn "$sim_target" defaults write "$APP_ID" DevMenuFAB.positionY -float 110 2>/dev/null || true
  "$FRESH_SCRIPT" --reset-only
  curl -sf -X POST "$MOCK_API/__mock/reset" >/dev/null \
    || { echo "❌  Contracts mock not reachable at $MOCK_API (pnpm mock:api)"; return 1; }
  xcrun simctl launch "$sim_target" "$APP_ID" >/dev/null 2>&1 || true
  sleep 5
  _maestro_setup "$PRIME_FLOW"
}

# ──────────── Setup runner (state-cached) ─────────────────────────
run_setup() {
  local entry="$1"
  local prev; prev=$(current_state)

  if [[ "${SKIP_SETUP:-false}" == true ]]; then
    echo "⏭️   Skipping setup (--skip-setup)"
    return 0
  fi
  if [[ "$prev" == "$entry" && "$entry" == activated ]]; then
    # The DB still holds the linked, signed-in register — a cold relaunch and
    # a Metro prime are all it takes (the previous flow left any screen).
    echo "♻️  State already 'activated' — relaunching the app"
    local sim_target="${MAESTRO_DEVICE_UDID:-booted}"
    xcrun simctl terminate "$sim_target" "$APP_ID" 2>/dev/null || true
    xcrun simctl launch "$sim_target" "$APP_ID" >/dev/null 2>&1 || true
    sleep 5
    _maestro_setup "$PRIME_FLOW"
    return
  fi
  if [[ "$prev" == "$entry" && "$entry" != fresh ]]; then
    # fresh NEVER reuses state: a fresh flow asserts Vincular, and the
    # previous fresh flow left the device activated (its code consumed).
    echo "♻️  State already '$entry' — skipping setup"
    return
  fi

  echo "🔧  Setting up entry point: $entry"
  case "$entry" in
    fresh)
      # reset_app ends primed and running on Vincular (M-11: the flows no
      # longer dance with simctl themselves — they just launchApp).
      reset_app || return 1
      ;;
    activated)
      # M-11's entry (A-05's rework): a linked, signed-in register. Wipe the
      # device clean, activate by code and sign in Toni, ending on Inicio
      # with one completed sync cycle.
      reset_app || return 1
      _maestro_setup "$ACTIVATED_FLOW" || return 1
      ;;
    demo)
      "$FRESH_SCRIPT" --reset-only
      # fresh-install.sh --reset-only deletes the DB but exits before its
      # terminate+reconnect, so the app keeps stale in-memory state and the
      # seed flow's launchApp would only foreground it. Force a cold start
      # (dev-client is already primed to localhost:8081).
      local sim_target="${MAESTRO_DEVICE_UDID:-booted}"
      local dev_url="exp+xangarro://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
      xcrun simctl terminate "$sim_target" "$APP_ID" 2>/dev/null || true
      xcrun simctl openurl "$sim_target" "$dev_url" 2>/dev/null || true
      sleep 5
      xcrun simctl terminate "$sim_target" "$APP_ID" 2>/dev/null || true
      echo "🌱  Seeding demo data (this takes 2-3 minutes)..."
      maestro test ${MAESTRO_DEVICE_UDID:+--device "$MAESTRO_DEVICE_UDID"} "$DEMO_FLOW"
      ;;
    wizard)
      "$FRESH_SCRIPT" "$WIZARD_FLOW"
      ;;
    *)
      echo "❌  Unknown entry point: $entry"
      return 1
      ;;
  esac

  echo "$entry" > "$STATE_FILE"
  echo "✅  Setup complete ($entry)"
}
