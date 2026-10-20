#!/usr/bin/env bash
# -------------------------------------------------------------------
# full-regression.sh — complete Maestro E2E regression suite
#
# Runs all Maestro flows in dependency order, building state
# progressively. Delete flows run last to avoid breaking
# subsequent tests that depend on the data.
#
# On failure, automatically runs maestro-diagnose.sh to capture
# the view hierarchy, screenshot, and a structured diagnostic
# report in the run directory under e2e-reports/runs/.
#
# Usage:
#   ./apps/mobile/maestro/scripts/full-regression.sh
#
# Options:
#   --skip-fresh     Skip the database reset (assumes already done)
#   --stop-on-fail   Stop immediately on first failure
#   --dry-run        Print the flow list without running
#   --open           Open the HTML report in a browser after run
#   --no-open        Never open the report (even on failure)
#   --open-reports   Alias for --open
#   --run-name       Override the auto-generated run name
#   --device-class   Target a specific device class ("se" | "iphone" | "ipad")
# -------------------------------------------------------------------
set -euo pipefail

# Disable FloatingCoinsBackground animations — Maestro waits for
# animations to settle after each tap (~14s overhead without this).
export EXPO_PUBLIC_E2E=1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FLOWS_DIR="$(cd "$SCRIPT_DIR/../flows" && pwd)"
FRESH_SCRIPT="$SCRIPT_DIR/fresh-install.sh"
DIAGNOSE_SCRIPT="$SCRIPT_DIR/maestro-diagnose.sh"
REPORT_COLLECT="$SCRIPT_DIR/report-collect.py"
REPORT_FINALIZE="$SCRIPT_DIR/report-finalize.py"
FOLD_AUDIT_SCRIPT="$SCRIPT_DIR/fold-audit.sh"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
REPORT_ROOT="$REPO_ROOT/e2e-reports"
REPORT_BASE="apps/mobile/maestro/reports"

# Shared entry-point detection + state setup (detect_entry / run_setup), so this
# runner seeds the correct state (fresh / demo / wizard) per flow — the same
# implementation run-flow.sh uses. Without this, the 58 demo flows never get
# demo seeding and always fail. See lib/entry-setup.sh.
source "$SCRIPT_DIR/lib/entry-setup.sh"

# ───────────────────────── Parse flags ──────────────────────────
SKIP_FRESH=false
STOP_ON_FAIL=false
DRY_RUN=false
OPEN_REPORT="auto"   # auto = open on failure; always; never
DEVICE_CLASS=""      # "se" | "iphone" | "ipad" — empty means use booted device
RUN_NAME=""          # Override auto-generated run name

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-fresh)    SKIP_FRESH=true;       shift ;;
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
PHASE_LABEL="all"
if [[ -n "$RUN_NAME" ]]; then
  RUN_ID="$RUN_NAME"
else
  RUN_ID="$(date +%Y-%m-%d_%H%M)_full-regression_${PHASE_LABEL}"
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

  # Put the app into this flow's entry-point state (state-cached: only re-seeds on
  # a transition). This is what lets demo/fresh flows run — previously every flow
  # ran against the single Phase-0 wizard state.
  run_setup "$(detect_entry "$flow")"

  mkdir -p "$debug_dir" "$test_dir"

  # Build optional --device flag (set by --device-class resolver above)
  local device_flag=()
  if [[ -n "${MAESTRO_DEVICE_UDID:-}" ]]; then
    device_flag=(--device "$MAESTRO_DEVICE_UDID")
  fi

  # Time the flow execution
  local start_seconds=$SECONDS

  # Bounded: a hung driver returns 124 instead of blocking forever.
  # FLOW_TIMEOUT is generous (default 6 min) because demo seeding inside a
  # flow is legitimately slow on a debug build.
  # `|| flow_rc=$?` is required, not stylistic: this script runs under
  # `set -e`, so a bare failing call would abort the whole suite before the
  # exit code could be inspected.
  local flow_rc=0
  with_timeout "${FLOW_TIMEOUT:-360}" \
    maestro test --debug-output "$debug_dir" "${device_flag[@]+"${device_flag[@]}"}" "$flow" \
    || flow_rc=$?

  if [[ $flow_rc -eq 124 ]]; then
    local elapsed_ms=$(( (SECONDS - start_seconds) * 1000 ))
    echo "  ⏱️   $name TIMED OUT after ${FLOW_TIMEOUT:-360}s (${elapsed_ms}ms)"
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

# ──────────────── The curated suite (M-11, A-16's ledger) ─────────
# The M-11 rewrite's per-screen suite, dependency-ordered and bucket-ordered
# by construction: every activated flow first (one state seed serves them
# all), the fresh-entry activation family last (one re-seed). The legacy
# demo/wizard phase ladder retired with its flows (A-16); the state cache in
# run_setup (lib/entry-setup.sh) still seeds exactly twice per run.
#
# settings-desvincular closes the activated bucket on purpose: it leaves the
# device unlinked, and the fresh bucket that follows re-seeds anyway.
run_curated_suite() {
  CURRENT_PHASE="M-11 suite"
  echo "🧭  M-11 curated suite (activated → fresh)"
  rm -f "$STATE_FILE"   # force a clean first setup regardless of prior runs

  # Baseline + auth
  run_flow "$FLOWS_DIR/smoke-launch.yaml"
  run_flow "$FLOWS_DIR/login-lockout.yaml"
  run_flow "$FLOWS_DIR/bloqueo.yaml"
  # Caja + ventas (the checkout is form-factor-aware: phone bar vs tablet
  # TicketPanel — shared/cobrar-ticket.yaml carries both branches)
  run_flow "$FLOWS_DIR/caja-abrir-cerrar.yaml"
  run_flow "$FLOWS_DIR/ventas-lista.yaml"
  run_flow "$FLOWS_DIR/venta-detalle-cancelar.yaml"
  run_flow "$FLOWS_DIR/fiado-abono-recordar.yaml"
  # Gastos
  run_flow "$FLOWS_DIR/gastos-registrar.yaml"
  run_flow "$FLOWS_DIR/gastos-pagar-recurrente.yaml"
  # Turno, cola, avisos, inventario
  run_flow "$FLOWS_DIR/mi-turno.yaml"
  run_flow "$FLOWS_DIR/por-enviar.yaml"
  run_flow "$FLOWS_DIR/cancelaciones-nav.yaml"
  run_flow "$FLOWS_DIR/avisos-responder.yaml"
  run_flow "$FLOWS_DIR/inventario-llego-merma.yaml"
  # Cierre family
  run_flow "$FLOWS_DIR/cierre-cuadra.yaml"
  run_flow "$FLOWS_DIR/caja-cierre-discrepancia.yaml"
  run_flow "$FLOWS_DIR/cierre-faltante.yaml"
  # Settings last of the activated bucket: desvincular unlinks the device.
  run_flow "$FLOWS_DIR/settings-desvincular.yaml"
  # Fresh entry: the activation family (one re-seed covers both).
  run_flow "$FLOWS_DIR/activation.yaml"
  run_flow "$FLOWS_DIR/login-operator-pin.yaml"
}

run_curated_suite

# ──────────────── Summary ──────────────────────────────────────
print_summary

# Finalize the report (build manifest, data.js, runs-index, prune old runs)
if [[ "$DRY_RUN" == false ]]; then
  python3 "$REPORT_FINALIZE" --run-dir "$RUN_DIR" --report-root "$REPORT_ROOT" || true
  echo ""
  echo "🌐  HTML Report: $REPORT_ROOT/index.html"
  echo "    Run dir:    $RUN_DIR"

  # Auto-open report
  SHOULD_OPEN=false
  if [[ "$OPEN_REPORT" == "always" ]]; then
    SHOULD_OPEN=true
  elif [[ "$OPEN_REPORT" == "auto" ]] && [[ $FAILED -gt 0 ]]; then
    SHOULD_OPEN=true
  fi

  if [[ "$SHOULD_OPEN" == true ]]; then
    echo ""
    echo "📂  Opening report in browser..."
    open "$REPORT_ROOT/index.html" 2>/dev/null || true
  fi
fi

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi
