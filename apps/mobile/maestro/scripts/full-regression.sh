#!/usr/bin/env bash
# -------------------------------------------------------------------
# full-regression.sh — complete Maestro E2E regression suite (A-16)
#
# Runs the flows listed in flows/suite.txt, in that order: every
# `activated` flow first (the device is activated once against the mock
# and each flow starts from a cold launch), then the `fresh` flows
# (activation itself). Entry points live in lib/entry-setup.sh.
#
# On failure, maestro-diagnose.sh captures the view hierarchy, a
# screenshot and a structured report under e2e-reports/runs/.
#
# Prerequisites: Metro on :8081, `PORT=3100 pnpm mock:api`, the dev build
# installed on the simulator, and the dev menu's "Tools button" turned off
# (it covers the top-bar cog on iPad).
#
# Usage:
#   ./apps/mobile/maestro/scripts/full-regression.sh [--device-class ipad]
#
# Options:
#   --stop-on-fail   Stop immediately on first failure
#   --dry-run        Print the flow list without running
#   --open           Open the HTML report in a browser after run
#   --no-open        Never open the report (even on failure)
#   --run-name       Override the auto-generated run name
#   --device-class   Target a specific device class ("se" | "iphone" | "ipad")
# -------------------------------------------------------------------
set -euo pipefail

# Disable FloatingCoinsBackground animations — Maestro waits for
# animations to settle after each tap (~14s overhead without this).
export EXPO_PUBLIC_E2E=1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FLOWS_DIR="$(cd "$SCRIPT_DIR/../flows" && pwd)"
SUITE_FILE="$FLOWS_DIR/suite.txt"
FRESH_SCRIPT="$SCRIPT_DIR/fresh-install.sh"
DIAGNOSE_SCRIPT="$SCRIPT_DIR/maestro-diagnose.sh"
REPORT_COLLECT="$SCRIPT_DIR/report-collect.py"
REPORT_FINALIZE="$SCRIPT_DIR/report-finalize.py"
FOLD_AUDIT_SCRIPT="$SCRIPT_DIR/fold-audit.sh"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
REPORT_ROOT="$REPO_ROOT/e2e-reports"
REPORT_BASE="apps/mobile/maestro/reports"

# Shared entry-point detection + state setup (detect_entry / run_setup /
# cold_start_app), the same implementation run-flow.sh uses.
source "$SCRIPT_DIR/lib/entry-setup.sh"

# ───────────────────────── Parse flags ──────────────────────────
STOP_ON_FAIL=false
DRY_RUN=false
OPEN_REPORT="auto"   # auto = open on failure; always; never
DEVICE_CLASS=""      # "se" | "iphone" | "ipad" — empty means use booted device
RUN_NAME=""          # Override auto-generated run name

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stop-on-fail)  STOP_ON_FAIL=true;     shift ;;
    --dry-run)       DRY_RUN=true;          shift ;;
    --open|--open-reports) OPEN_REPORT="always"; shift ;;
    --no-open)       OPEN_REPORT="never";   shift ;;
    --run-name)      RUN_NAME="$2";         shift 2 ;;
    --device-class)  DEVICE_CLASS="$2";     shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ──────────── Resolve device UDID for the chosen class ──────────
# When --device-class is passed, resolve the target UDID and export
# MAESTRO_DEVICE_UDID so fresh-install.sh and every maestro test call
# target the correct simulator, then boot it.
#
# Implementation lives in lib/device-resolve.sh, shared with run-flow.sh
# and run-ipad.sh. The previous inline copy ran the resolution twice —
# the first attempt set _RESOLVE_TARGET as a command-prefix assignment
# AFTER the pipeline that reads it, so it always returned empty.
# shellcheck source=lib/device-resolve.sh
source "$SCRIPT_DIR/lib/device-resolve.sh"
# with_timeout / kill_maestro_driver — bounds each `maestro test` so a dead
# XCUITest driver cannot wedge the whole suite (see lib/with-timeout.sh).
# shellcheck source=lib/with-timeout.sh
source "$SCRIPT_DIR/lib/with-timeout.sh"

if [[ -n "$DEVICE_CLASS" ]]; then
  # --dry-run only prints the flow list, so resolve the UDID but skip the boot.
  if [[ "$DRY_RUN" == true ]]; then
    ensure_device "$DEVICE_CLASS"
  else
    resolve_device "$DEVICE_CLASS"
  fi
fi

# ──────────── Create run directory for E2E report ─────────────
if [[ -n "$RUN_NAME" ]]; then
  RUN_ID="$RUN_NAME"
else
  RUN_ID="$(date +%Y-%m-%d_%H%M)_full-regression"
fi
RUN_DIR="$REPORT_ROOT/runs/$RUN_ID"
if [[ "$DRY_RUN" == false ]]; then
  mkdir -p "$RUN_DIR/tests"
fi

# Legacy report dir (used by maestro-diagnose.sh as intermediate)
mkdir -p "$REPORT_BASE"

CURRENT_PHASE=""

# ──────────────── Helpers ──────────────────────────────────────
PASSED=0
FAILED=0
SKIPPED=0
FAILURES=()

run_flow() {
  local flow="$1"
  local name
  name="$(basename "$flow" .yaml)"
  local debug_dir="$REPORT_BASE/$name/debug"
  local test_dir="$RUN_DIR/tests/$name"

  if [[ "$DRY_RUN" == true ]]; then
    echo "  📋  $name  [entry: $(detect_entry "$flow")]"
    return 0
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🧪  $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Put the app into this flow's entry-point state (state-cached: activation
  # runs once per suite unless a fresh flow intervenes).
  local entry; entry="$(detect_entry "$flow")"
  run_setup "$entry"
  # Every activated flow starts from a cold app launch on the operator list, so
  # navigation left behind by the previous flow can't leak into this one.
  [[ "$entry" == activated ]] && cold_start_app

  # Clear the previous run's debug artifacts: failure reports otherwise
  # pick up stale screenshots and hierarchies.
  rm -rf "$debug_dir"
  mkdir -p "$debug_dir" "$test_dir"

  # Build optional --device flag (set by --device-class resolver above)
  local device_flag=()
  if [[ -n "${MAESTRO_DEVICE_UDID:-}" ]]; then
    device_flag=(--device "$MAESTRO_DEVICE_UDID")
  fi

  # Time the flow execution
  local start_seconds=$SECONDS

  # Bounded: a hung driver returns 124 instead of blocking forever.
  # FLOW_TIMEOUT is generous (default 6 min) for slow debug builds.
  # `|| flow_rc=$?` is required, not stylistic: this script runs under
  # `set -e`, so a bare failing call would abort the whole suite before the
  # exit code could be inspected.
  # A flow may raise its own bound with `# x-flow-timeout: <seconds>` in its
  # header (auto-lock-smoke waits out the real 5-minute inactivity lock).
  local flow_timeout
  flow_timeout=$(_flow_header "$flow" | sed -n 's/^# x-flow-timeout: \([0-9]*\).*/\1/p' | head -1)
  flow_timeout="${flow_timeout:-${FLOW_TIMEOUT:-360}}"
  local flow_rc=0
  with_timeout "$flow_timeout" \
    maestro test --debug-output "$debug_dir" "${device_flag[@]+"${device_flag[@]}"}" "$flow" \
    || flow_rc=$?

  if [[ $flow_rc -eq 124 ]]; then
    local elapsed_ms=$(( (SECONDS - start_seconds) * 1000 ))
    echo "  ⏱️   $name TIMED OUT after ${flow_timeout}s (${elapsed_ms}ms)"
    FAILED=$((FAILED + 1))
    FAILURES+=("$name (timeout)")
    # A timeout almost always means the driver died; recover so the next
    # flow does not fail with "Connection refused".
    kill_maestro_driver
    python3 "$REPORT_COLLECT" \
      --run-dir "$RUN_DIR" --flow "$flow" --status failed \
      --duration-ms "$elapsed_ms" --phase "$CURRENT_PHASE" \
      --debug-dir "$debug_dir" || true
    return 0
  fi

  if [[ $flow_rc -eq 0 ]]; then
    local elapsed_ms=$(( (SECONDS - start_seconds) * 1000 ))
    echo "  ✅  $name PASSED (${elapsed_ms}ms)"
    PASSED=$((PASSED + 1))

    # Fold audit: scroll the terminal screen and diff the hierarchy to find
    # controls that sit below the fold with no visual cue. Runs on the PASS
    # branch only — on a failure the app is wherever the flow died, and
    # maestro-diagnose.sh has already captured that state. Opt-in via
    # FOLD_AUDIT=1; always exits 0 so it can never fail the suite.
    "$FOLD_AUDIT_SCRIPT" "$flow" "$test_dir" || true

    # Collect result (commands.json extracted, then debug dir cleaned)
    python3 "$REPORT_COLLECT" \
      --run-dir "$RUN_DIR" --flow "$flow" --status passed \
      --duration-ms "$elapsed_ms" --phase "$CURRENT_PHASE" \
      --debug-dir "$debug_dir" || true

    # Clean debug output for passing tests (save disk)
    rm -rf "$debug_dir"
  else
    local elapsed_ms=$(( (SECONDS - start_seconds) * 1000 ))
    echo "  ❌  $name FAILED (${elapsed_ms}ms)"
    FAILED=$((FAILED + 1))
    FAILURES+=("$name")

    # Auto-diagnose: capture hierarchy + produce diagnostic report
    echo ""
    echo "  🔬  Running auto-diagnosis..."
    "$DIAGNOSE_SCRIPT" "$flow" "$debug_dir" "$test_dir" || true

    # Collect result (after diagnosis has written artifacts to test_dir)
    python3 "$REPORT_COLLECT" \
      --run-dir "$RUN_DIR" --flow "$flow" --status failed \
      --duration-ms "$elapsed_ms" --phase "$CURRENT_PHASE" \
      --debug-dir "$debug_dir" || true

    if [[ "$STOP_ON_FAIL" == true ]]; then
      echo ""
      echo "⛔  Stopping on first failure (--stop-on-fail)."
      # Finalize partial report before exiting
      python3 "$REPORT_FINALIZE" --run-dir "$RUN_DIR" --report-root "$REPORT_ROOT" || true
      print_summary
      exit 1
    fi
  fi
}

print_summary() {
  local total=$((PASSED + FAILED + SKIPPED))
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊  REGRESSION SUMMARY"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Total:   $total"
  echo "  Passed:  $PASSED"
  echo "  Failed:  $FAILED"
  echo "  Skipped: $SKIPPED"
  if [[ ${#FAILURES[@]} -gt 0 ]]; then
    echo ""
    echo "  ❌ Failures (diagnostic reports):"
    for f in "${FAILURES[@]}"; do
      local report_file="$REPORT_BASE/$f/report.md"
      if [[ -f "$report_file" ]]; then
        echo "     - $f → $report_file"
      else
        echo "     - $f (no diagnostic report)"
      fi
    done
  fi
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ── Suite: flows/suite.txt order, activated flows before fresh ones ──────────
suite_flows() {
  grep -vE '^[[:space:]]*(#|$)' "$SUITE_FILE" | sed -E 's/[[:space:]]+#.*$//; s/[[:space:]]+$//'
}

run_suite() {
  rm -f "$STATE_FILE"   # force a clean first setup regardless of prior runs
  local activated=() fresh=() name f
  while IFS= read -r name; do
    f="$FLOWS_DIR/$name"
    if [[ ! -f "$f" ]]; then echo "⚠️   suite.txt lists a missing flow: $name"; continue; fi
    if [[ "$(detect_entry "$f")" == fresh ]]; then fresh+=("$f"); else activated+=("$f"); fi
  done < <(suite_flows)
  echo "🧭  Suite: activated=${#activated[@]}  fresh=${#fresh[@]}"
  CURRENT_PHASE="Activated device"
  for f in "${activated[@]+"${activated[@]}"}"; do run_flow "$f"; done
  CURRENT_PHASE="Fresh install"
  for f in "${fresh[@]+"${fresh[@]}"}"; do run_flow "$f"; done
}

# ── Trap handler: finalize partial report on interrupt ──────────
finalize_on_exit() {
  if [[ "$DRY_RUN" == true ]] || [[ -z "${RUN_DIR:-}" ]]; then
    return 0
  fi
  echo ""
  echo "📊  Finalizing report (interrupted)..."
  python3 "$REPORT_FINALIZE" --run-dir "$RUN_DIR" --report-root "$REPORT_ROOT" --interrupted || true
}
trap finalize_on_exit INT TERM

run_suite
print_summary

if [[ "$DRY_RUN" == false ]]; then
  python3 "$REPORT_FINALIZE" --run-dir "$RUN_DIR" --report-root "$REPORT_ROOT" || true
  echo ""
  echo "🌐  HTML Report: $REPORT_ROOT/index.html"
  echo "    Run dir:    $RUN_DIR"
  if [[ "$OPEN_REPORT" == "always" ]] || { [[ "$OPEN_REPORT" == "auto" ]] && [[ $FAILED -gt 0 ]]; }; then
    open "$REPORT_ROOT/index.html" 2>/dev/null || true
  fi
fi

[[ $FAILED -gt 0 ]] && exit 1
exit 0
