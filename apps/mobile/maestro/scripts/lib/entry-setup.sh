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
STATE_FILE="${STATE_FILE:-/tmp/maestro-entry-state}"
APP_ID="${APP_ID:-mx.cachink.mobile}"

# ──────────── Entry point detection ───────────────────────────────
# Prefer structured `# x-entrypoint:` metadata; fall back to a
# `# Precondition:` comment; default to wizard.
detect_entry() {
  local flow="$1"
  local xentry
  xentry=$(head -15 "$flow" | sed -n 's/^# x-entrypoint: \([a-z]*\).*/\1/p' 2>/dev/null | head -1)
  if [[ -n "$xentry" ]]; then echo "$xentry"; return; fi

  local precondition
  precondition=$(head -15 "$flow" | grep -i '# Precondition:' 2>/dev/null | head -1 || true)
  if [[ -z "$precondition" ]]; then echo "wizard"; return; fi

  if echo "$precondition" | grep -qi 'fresh install'; then echo "fresh"
  elif echo "$precondition" | grep -qi 'demo mode'; then echo "demo"
  else echo "wizard"; fi
}

current_state() {
  if [[ -f "$STATE_FILE" ]]; then cat "$STATE_FILE"; else echo "none"; fi
}

# ──────────── Setup runner (state-cached) ─────────────────────────
run_setup() {
  local entry="$1"
  local prev; prev=$(current_state)

  if [[ "${SKIP_SETUP:-false}" == true ]]; then
    echo "⏭️   Skipping setup (--skip-setup)"
    return 0
  fi
  if [[ "$prev" == "$entry" ]]; then
    echo "♻️   State already '$entry' — skipping setup"
    return 0
  fi

  echo "🔧  Setting up entry point: $entry"
  case "$entry" in
    fresh)
      "$FRESH_SCRIPT" --reset-only
      ;;
    demo)
      "$FRESH_SCRIPT" --reset-only
      # fresh-install.sh --reset-only deletes the DB but exits before its
      # terminate+reconnect, so the app keeps stale in-memory state and the
      # seed flow's launchApp would only foreground it. Force a cold start
      # (dev-client is already primed to localhost:8081).
      local sim_target="${MAESTRO_DEVICE_UDID:-booted}"
      local dev_url="exp+cachink://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
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
