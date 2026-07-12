#!/usr/bin/env bash
# -------------------------------------------------------------------
# run-flow.sh — unified Maestro flow runner with automatic setup
#
# Reads each flow's entry-point metadata (# x-entrypoint: or
# # Precondition:) and runs the correct setup before executing it.
#
# Entry points:
#   fresh  — DB reset only (no wizard). For flows that test the
#            fresh-install experience itself.
#   demo   — DB reset + demo-mode seeding. Pre-creates users
#            (Ana Operativa, Juan Director, PIN 000000) and sample
#            data (~50 records). ~2-3 min seeding time.
#   wizard — DB reset + wizard-local-standalone. Creates Director
#            Test user (PIN 123456). The default for most flows.
#
# Usage:
#   ./apps/mobile/maestro/scripts/run-flow.sh flows/venta-efectivo.yaml
#   ./apps/mobile/maestro/scripts/run-flow.sh --entry demo flows/smoke-launch.yaml
#   ./apps/mobile/maestro/scripts/run-flow.sh --dry-run flows/*.yaml
# -------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FLOWS_DIR="$(cd "$SCRIPT_DIR/../flows" && pwd)"
FRESH_SCRIPT="$SCRIPT_DIR/fresh-install.sh"
DEMO_FLOW="$FLOWS_DIR/demo-mode-setup.yaml"
WIZARD_FLOW="$FLOWS_DIR/wizard-local-standalone.yaml"
STATE_FILE="/tmp/maestro-entry-state"
DIAGNOSE_SCRIPT="$SCRIPT_DIR/maestro-diagnose.sh"
REPORT_COLLECT="$SCRIPT_DIR/report-collect.py"
REPORT_FINALIZE="$SCRIPT_DIR/report-finalize.py"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
REPORT_ROOT="$REPO_ROOT/e2e-reports"

# ──────── Ensure E2E mode (disables continuous animations) ──────
# FloatingCoinsBackground renders 36 animated particles on gate
# screens. Maestro's iOS driver waits for animations to settle
# after each tap; with particles running, that adds ~14s/tap.
# EXPO_PUBLIC_E2E=1 disables these particles (see floating-coins-background.tsx).
export EXPO_PUBLIC_E2E=1

# ───────────────────────── Parse flags ──────────────────────────
ENTRY_MODE="auto"
SKIP_SETUP=false
DEVICE_CLASS=""
DRY_RUN=false
POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --entry)         ENTRY_MODE="$2";      shift 2 ;;
    --skip-setup)    SKIP_SETUP=true;      shift ;;
    --device-class)  DEVICE_CLASS="$2";    shift 2 ;;
    --dry-run)       DRY_RUN=true;         shift ;;
    -h|--help)
      echo "Usage: run-flow.sh [OPTIONS] <flow.yaml> [flow2.yaml ...]"
      echo ""
      echo "Options:"
      echo "  --entry fresh|demo|wizard|auto   Force entry point (default: auto)"
      echo "  --skip-setup                     Skip setup (assume state is ready)"
      echo "  --device-class iphone|ipad       Target device class"
      echo "  --dry-run                        Print what would run"
      echo "  -h, --help                       Show this help"
      exit 0
      ;;
    *)
      POSITIONAL_ARGS+=("$1")
      shift
      ;;
  esac
done

set -- "${POSITIONAL_ARGS[@]+"${POSITIONAL_ARGS[@]}"}"

if [[ $# -eq 0 ]]; then
  echo "❌  No flow files specified."
  echo "    Usage: run-flow.sh [OPTIONS] <flow.yaml> [flow2.yaml ...]"
  exit 1
fi

# ──────────── Resolve device (reuse full-regression pattern) ──────
if [[ -n "$DEVICE_CLASS" ]]; then
  DEVICE_PATTERN="${MAESTRO_IPAD_DEVICE:-iPad (10th generation)}"
  if [[ "$DEVICE_CLASS" == "iphone" ]]; then
    DEVICE_PATTERN="${MAESTRO_IPHONE_DEVICE:-iPhone 16}"
  fi

  export _RESOLVE_TARGET="$DEVICE_PATTERN"
  RESOLVED_UDID=$(xcrun simctl list devices available -j 2>/dev/null \
    | python3 -c "
import sys, json, os
target = os.environ.get('_RESOLVE_TARGET', '')
data = json.load(sys.stdin)
for _, devs in data.get('devices', {}).items():
    for d in devs:
        if target.lower() in d.get('name', '').lower():
            print(d['udid'])
            sys.exit(0)
" 2>/dev/null || true)

  if [[ -z "$RESOLVED_UDID" ]]; then
    echo "❌  Could not find simulator matching '$DEVICE_PATTERN'."
    exit 1
  fi

  export MAESTRO_DEVICE_UDID="$RESOLVED_UDID"
  echo "🎯  Device: $DEVICE_PATTERN ($RESOLVED_UDID)"
fi

# ──────────── Entry point detection ───────────────────────────────

detect_entry() {
  local flow="$1"

  # Prefer structured x-entrypoint metadata
  local xentry
  xentry=$(head -15 "$flow" | sed -n 's/^# x-entrypoint: \([a-z]*\).*/\1/p' 2>/dev/null | head -1)
  if [[ -n "$xentry" ]]; then
    echo "$xentry"
    return
  fi

  # Fall back to parsing # Precondition: comment
  local precondition
  precondition=$(head -15 "$flow" | grep -i '# Precondition:' 2>/dev/null | head -1 || true)

  if [[ -z "$precondition" ]]; then
    # No precondition found — default to wizard
    echo "wizard"
    return
  fi

  # Match patterns (order matters: most specific first)
  if echo "$precondition" | grep -qi 'fresh install'; then
    echo "fresh"
  elif echo "$precondition" | grep -qi 'demo mode'; then
    echo "demo"
  else
    echo "wizard"
  fi
}

# ──────────── Setup runner ────────────────────────────────────────

current_state() {
  if [[ -f "$STATE_FILE" ]]; then
    cat "$STATE_FILE"
  else
    echo "none"
  fi
}

run_setup() {
  local entry="$1"
  local prev
  prev=$(current_state)

  if [[ "$SKIP_SETUP" == true ]]; then
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
      echo "🌱  Seeding demo data (this takes 2-3 minutes)..."
      maestro test ${MAESTRO_DEVICE_UDID:+--device "$MAESTRO_DEVICE_UDID"} "$DEMO_FLOW"
      ;;
    wizard)
      "$FRESH_SCRIPT" "$WIZARD_FLOW"
      ;;
    *)
      echo "❌  Unknown entry point: $entry"
      exit 1
      ;;
  esac

  echo "$entry" > "$STATE_FILE"
  echo "✅  Setup complete ($entry)"
}

# ──────────── Main: process each flow ─────────────────────────────

PASSED=0
FAILED=0
TOTAL=$#

# Create run directory for E2E report
RUN_ID="$(date +%Y-%m-%d_%H%M)_single-flow"
RUN_DIR="$REPORT_ROOT/runs/$RUN_ID"
if [[ "$DRY_RUN" == false ]]; then
  mkdir -p "$RUN_DIR/tests"
fi

# Trap handler: finalize partial report on interrupt
finalize_on_exit() {
  if [[ "$DRY_RUN" == true ]] || [[ -z "${RUN_DIR:-}" ]]; then
    return 0
  fi
  python3 "$REPORT_FINALIZE" --run-dir "$RUN_DIR" --report-root "$REPORT_ROOT" --interrupted 2>/dev/null || true
}
trap finalize_on_exit INT TERM

for flow in "$@"; do
  # Resolve relative paths
  if [[ ! -f "$flow" ]]; then
    # Try relative to flows dir
    if [[ -f "$FLOWS_DIR/$flow" ]]; then
      flow="$FLOWS_DIR/$flow"
    elif [[ -f "$FLOWS_DIR/$(basename "$flow")" ]]; then
      flow="$FLOWS_DIR/$(basename "$flow")"
    else
      echo "❌  Flow not found: $flow"
      FAILED=$((FAILED + 1))
      continue
    fi
  fi

  local_entry="$ENTRY_MODE"
  if [[ "$local_entry" == "auto" ]]; then
    local_entry=$(detect_entry "$flow")
  fi

  name="$(basename "$flow" .yaml)"

  if [[ "$DRY_RUN" == true ]]; then
    echo "📋  $name"
    echo "    entry: $local_entry"
    case "$local_entry" in
      fresh)  echo "    setup: fresh-install.sh --reset-only" ;;
      demo)   echo "    setup: fresh-install.sh --reset-only + maestro test demo-mode-setup.yaml" ;;
      wizard) echo "    setup: fresh-install.sh wizard-local-standalone.yaml" ;;
    esac
    echo "    run:   maestro test $flow"
    echo ""
    continue
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🧪  $name (entry: $local_entry)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  run_setup "$local_entry"

  local debug_dir="$RUN_DIR/tests/$name/debug"
  local test_dir="$RUN_DIR/tests/$name"
  mkdir -p "$debug_dir" "$test_dir"

  local start_seconds=$SECONDS

  if maestro test --debug-output "$debug_dir" ${MAESTRO_DEVICE_UDID:+--device "$MAESTRO_DEVICE_UDID"} "$flow"; then
    local elapsed_ms=$(( (SECONDS - start_seconds) * 1000 ))
    echo "  ✅  $name PASSED (${elapsed_ms}ms)"
    PASSED=$((PASSED + 1))

    python3 "$REPORT_COLLECT" \
      --run-dir "$RUN_DIR" --flow "$flow" --status passed \
      --duration-ms "$elapsed_ms" --debug-dir "$debug_dir" || true
    rm -rf "$debug_dir"
  else
    local elapsed_ms=$(( (SECONDS - start_seconds) * 1000 ))
    echo "  ❌  $name FAILED (${elapsed_ms}ms)"
    FAILED=$((FAILED + 1))

    echo "  🔬  Running auto-diagnosis..."
    "$DIAGNOSE_SCRIPT" "$flow" "$debug_dir" "$test_dir" || true

    python3 "$REPORT_COLLECT" \
      --run-dir "$RUN_DIR" --flow "$flow" --status failed \
      --duration-ms "$elapsed_ms" --debug-dir "$debug_dir" || true
  fi
done

# ──────────── Summary ─────────────────────────────────────────────

if [[ "$DRY_RUN" == false && $TOTAL -gt 1 ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊  SUMMARY: $PASSED passed, $FAILED failed (of $TOTAL)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

# Finalize the report
if [[ "$DRY_RUN" == false ]]; then
  python3 "$REPORT_FINALIZE" --run-dir "$RUN_DIR" --report-root "$REPORT_ROOT" || true
  echo ""
  echo "🌐  HTML Report: $REPORT_ROOT/index.html"

  if [[ $FAILED -gt 0 ]]; then
    echo "📂  Opening report in browser..."
    open "$REPORT_ROOT/index.html" 2>/dev/null || true
  fi
fi

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi
