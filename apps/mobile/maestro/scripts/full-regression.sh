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
#   --skip-fresh     Skip the database reset + wizard (assumes already done)
#   --phase A|B|C|D|E|W  Run only a specific phase (W = wizard with fresh-install)
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
PHASE=""
STOP_ON_FAIL=false
DRY_RUN=false
OPEN_REPORT="auto"   # auto = open on failure; always; never
DEVICE_CLASS=""      # "se" | "iphone" | "ipad" — empty means use booted device
RUN_NAME=""          # Override auto-generated run name

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-fresh)    SKIP_FRESH=true;       shift ;;
    --phase)         PHASE="$2";            shift 2 ;;
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
PHASE_LABEL="${PHASE:-all}"
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

should_run() {
  local phase="$1"
  [[ -z "$PHASE" ]] || [[ "$PHASE" == "$phase" ]]
}

# ── Default run: entry-point-aware, grouped so each state seeds once ─────────
# Collects THIS script's own active (uncommented) run_flow list — the curated,
# dependency-ordered set — then buckets by entry-point (demo → wizard/other →
# fresh) preserving relative order within each bucket, so run_setup re-seeds ~3×
# instead of ~60× (the interleaved order would otherwise reseed demo on every
# transition). Used when no --phase is given; --phase keeps the legacy linear path.
run_grouped_suite() {
  echo "🧭  Entry-point-aware grouped MVP run (demo → wizard → fresh)"
  rm -f "$STATE_FILE"   # force a clean first setup regardless of prior runs

  local flows=()
  while IFS= read -r name; do
    [[ -f "$FLOWS_DIR/$name" ]] && flows+=("$FLOWS_DIR/$name")
  done < <(grep -E '^[[:space:]]*run_flow[[:space:]]+"\$FLOWS_DIR/' "$0" \
            | sed -E 's#.*\$FLOWS_DIR/([A-Za-z0-9_.-]+\.yaml).*#\1#')

  local demo=() wizard=() fresh=() f e
  for f in "${flows[@]+"${flows[@]}"}"; do
    e="$(detect_entry "$f")"
    case "$e" in
      demo)  demo+=("$f") ;;
      fresh) fresh+=("$f") ;;
      *)     wizard+=("$f") ;;   # wizard + anything unrecognized
    esac
  done

  local ordered=()
  ordered+=("${demo[@]+"${demo[@]}"}")
  ordered+=("${wizard[@]+"${wizard[@]}"}")
  ordered+=("${fresh[@]+"${fresh[@]}"}")

  echo "   demo=${#demo[@]}  wizard=${#wizard[@]}  fresh=${#fresh[@]}  total=${#ordered[@]}"
  CURRENT_PHASE="Grouped MVP run"
  for f in "${ordered[@]+"${ordered[@]}"}"; do
    run_flow "$f"
  done
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

# ── Default: entry-point-aware grouped run (per-flow run_setup handles state) ──
# --phase falls through to the legacy linear path below for targeted debugging.
if [[ -z "$PHASE" ]]; then
  run_grouped_suite
  if [[ "$DRY_RUN" == false ]]; then
    python3 "$REPORT_FINALIZE" --run-dir "$RUN_DIR" --report-root "$REPORT_ROOT" || true
  fi
  print_summary
  [[ "$DRY_RUN" == false && $FAILED -gt 0 ]] && exit 1
  exit 0
fi

# ──────────────── Phase 0: Fresh install + wizard (legacy --phase path) ──────
if [[ "$SKIP_FRESH" == false ]]; then
  echo "🔄  Phase 0: Fresh install + wizard"
  if [[ "$DRY_RUN" == true ]]; then
    echo "  📋  fresh-install.sh + wizard-local-standalone"
  else
    "$FRESH_SCRIPT" "$FLOWS_DIR/wizard-local-standalone.yaml"
  fi
fi

# ──────────────── Phase 1: Empty states (before data) ──────────
if should_run "C"; then
  CURRENT_PHASE="Phase 1: Empty states"
  echo ""
  echo "📂  Phase 1: Empty states"
  run_flow "$FLOWS_DIR/empty-ventas.yaml"
  run_flow "$FLOWS_DIR/ventas-productos-gate.yaml"            # Products gate before caja gate
  run_flow "$FLOWS_DIR/empty-productos.yaml"
  run_flow "$FLOWS_DIR/empty-estados.yaml"
  run_flow "$FLOWS_DIR/empty-egresos.yaml"                  # B2 — Phase 15
  # run_flow "$FLOWS_DIR/empty-clientes.yaml"                 # A4 — Phase 15 (parked-mvp)
fi

# ──────────────── Phase 2: Create baseline data ────────────────
CURRENT_PHASE="Phase 2: Create baseline data"
echo ""
echo "📂  Phase 2: Create baseline data"
run_flow "$FLOWS_DIR/inventario-producto.yaml"
run_flow "$FLOWS_DIR/ventas-caja-gate.yaml"                  # Caja gate (requires product)
# run_flow "$FLOWS_DIR/cliente-crear.yaml"                   # (parked-mvp)
# run_flow "$FLOWS_DIR/cliente-crear-full-form.yaml"          # Gap 6 — Phase 16 (parked-mvp)

# ──────────────── Phase 3: Product management ──────────────────
if should_run "B"; then
  CURRENT_PHASE="Phase 3: Product management"
  echo ""
  echo "📂  Phase 3: Product management"
  run_flow "$FLOWS_DIR/producto-entrada-stock.yaml"
  run_flow "$FLOWS_DIR/producto-movimientos.yaml"
  run_flow "$FLOWS_DIR/stock-kpi-strip.yaml"                # C1 — Phase 15
  run_flow "$FLOWS_DIR/stock-buscar.yaml"                   # C2 — Phase 15
  run_flow "$FLOWS_DIR/stock-bajo-ver-link.yaml"            # C3 — Phase 15
fi

if should_run "A"; then
  run_flow "$FLOWS_DIR/editar-producto.yaml"
  run_flow "$FLOWS_DIR/editar-producto-full-form.yaml"      # Gap 4 — Phase 16
  run_flow "$FLOWS_DIR/movimiento-salida-con-motivo.yaml"   # E1 — Phase 15
  run_flow "$FLOWS_DIR/movimiento-entrada-con-nota.yaml"    # E2 — Phase 15
fi

if should_run "C"; then
  run_flow "$FLOWS_DIR/producto-full-form.yaml"
  run_flow "$FLOWS_DIR/nuevo-producto-icon-picker.yaml"  # Audit — previously excluded
  run_flow "$FLOWS_DIR/producto-via-fab.yaml"             # Audit — previously excluded
  # MVP-parked: producto-uso-selector depends on conversion flag
  # run_flow "$FLOWS_DIR/producto-uso-selector.yaml"
fi

# ──────────────── Phase 4: Sales ───────────────────────────────
CURRENT_PHASE="Phase 4: Sales"
echo ""
echo "📂  Phase 4: Sales"
run_flow "$FLOWS_DIR/venta-ciclo-completo.yaml"        # Must run first — deterministic totals
run_flow "$FLOWS_DIR/venta-efectivo.yaml"

if should_run "B"; then
  run_flow "$FLOWS_DIR/venta-manual.yaml"
  run_flow "$FLOWS_DIR/venta-otros-metodos.yaml"
fi

# run_flow "$FLOWS_DIR/venta-credito.yaml"                   # (parked-mvp)

# PARKED 2026-09-07: tests the removed SessionStrip sales-list + venta-detail-popover UI
#   (replaced by TotalBar; no layout renders `ventas-list`). Moved to flows/parked-mvp/.
# run_flow "$FLOWS_DIR/venta-comprobante.yaml"

if should_run "C"; then
  run_flow "$FLOWS_DIR/venta-cantidad-multiple.yaml"
  run_flow "$FLOWS_DIR/venta-search-product.yaml"
  # PARKED 2026-09-07: tests the removed SessionStrip sales-list + venta-detail-popover UI
  #   (replaced by TotalBar; no layout renders `ventas-list`). Moved to flows/parked-mvp/.
  # run_flow "$FLOWS_DIR/venta-detail-popover-inspect.yaml" # Audit — previously excluded
  run_flow "$FLOWS_DIR/checkout-method-picker.yaml"        # NEW — uncovered screen
  run_flow "$FLOWS_DIR/venta-stock-insuficiente.yaml"      # Edge — VEN-16
  # run_flow "$FLOWS_DIR/venta-credito-flag-off.yaml"        # Edge — CXC-08 (parked-mvp)
fi

if should_run "A"; then
  # PARKED 2026-09-07: tests the removed SessionStrip sales-list + venta-detail-popover UI
  #   (replaced by TotalBar; no layout renders `ventas-list`). Moved to flows/parked-mvp/.
  # run_flow "$FLOWS_DIR/editar-venta.yaml"
  # PARKED 2026-09-07: tests the removed SessionStrip sales-list + venta-detail-popover UI
  #   (replaced by TotalBar; no layout renders `ventas-list`). Moved to flows/parked-mvp/.
  # run_flow "$FLOWS_DIR/editar-venta-full-form.yaml"         # Gap 2 — Phase 16
  run_flow "$FLOWS_DIR/ventas-total-y-fecha.yaml"           # Gap 1 — Phase 16
fi

# ──────────────── Phase 5: Egresos ─────────────────────────────
CURRENT_PHASE="Phase 5: Egresos"
echo ""
echo "📂  Phase 5: Egresos"
run_flow "$FLOWS_DIR/egreso-gasto.yaml"
run_flow "$FLOWS_DIR/egreso-nomina.yaml"
run_flow "$FLOWS_DIR/egreso-nomina-field-assertions.yaml"   # Gap 13 — Phase 16
run_flow "$FLOWS_DIR/egreso-inventario.yaml"
run_flow "$FLOWS_DIR/egreso-recurrente.yaml"
run_flow "$FLOWS_DIR/egreso-gasto-full-form.yaml"           # B1 — Phase 15
run_flow "$FLOWS_DIR/egresos-total-y-fecha.yaml"            # B3 — Phase 15
run_flow "$FLOWS_DIR/egreso-recurrente-mensual.yaml"        # G1 — Phase 15

if should_run "C"; then
  run_flow "$FLOWS_DIR/validation-egreso.yaml"
  run_flow "$FLOWS_DIR/egreso-recurrente-semanal.yaml"
  run_flow "$FLOWS_DIR/egreso-gasto-via-fab.yaml"         # Audit — previously excluded
  run_flow "$FLOWS_DIR/egreso-inventario-empty-state.yaml" # Audit — previously excluded
  run_flow "$FLOWS_DIR/egreso-nomina-periodo.yaml"        # Audit — previously excluded
  run_flow "$FLOWS_DIR/egreso-recurrente-descartar.yaml"  # Audit — previously excluded
  run_flow "$FLOWS_DIR/egreso-recurrente-quincenal.yaml"  # Edge — EGR-15
fi

if should_run "A"; then
  run_flow "$FLOWS_DIR/editar-egreso.yaml"
  run_flow "$FLOWS_DIR/editar-egreso-full-form.yaml"        # Gap 3 — Phase 16
  run_flow "$FLOWS_DIR/nuevo-egreso-cancel.yaml"            # Gap 21 — Phase 16
fi

# ──────────────── Phase 6: Employee management ─────────────────
if should_run "A"; then
  CURRENT_PHASE="Phase 6: Employee management"
  echo ""
  echo "📂  Phase 6: Employee management"
  # run_flow "$FLOWS_DIR/empleado-editar.yaml"               # (parked-mvp)
  # run_flow "$FLOWS_DIR/empleado-eliminar.yaml"             # (parked-mvp)
fi

# ──────────────── Phase 7: Clientes + CxC ─────────────────────
CURRENT_PHASE="Phase 7: Clientes + CxC"
echo ""
echo "📂  Phase 7: Clientes + CxC"
# run_flow "$FLOWS_DIR/cliente-buscar.yaml"                   # A2 — Phase 15 (parked-mvp)
# run_flow "$FLOWS_DIR/cliente-detail-screen.yaml"            # A1 — Phase 15 (parked-mvp)
# run_flow "$FLOWS_DIR/cliente-editar.yaml"                   # A3 — Phase 15 (parked-mvp)
# run_flow "$FLOWS_DIR/registrar-pago-full-form.yaml"         # H3 — Phase 15 (parked-mvp)
# run_flow "$FLOWS_DIR/cliente-pago-parcial.yaml"             # (parked-mvp)
# run_flow "$FLOWS_DIR/cliente-pago-completo.yaml"            # (parked-mvp)
# run_flow "$FLOWS_DIR/pago-sobrepago-rechazado.yaml"           # Edge — CXC-07 (parked-mvp)
# run_flow "$FLOWS_DIR/cliente-detail-empty-state.yaml"       # Gap 22 — Phase 16 (parked-mvp)
# run_flow "$FLOWS_DIR/cliente-crear-via-fab.yaml"            # Audit (parked-mvp)

# ──────────────── Phase 8: Corte de día ────────────────────────
CURRENT_PHASE="Phase 8: Corte de día"
echo ""
echo "📂  Phase 8: Corte de día"
run_flow "$FLOWS_DIR/corte-de-dia.yaml"
run_flow "$FLOWS_DIR/corte-de-dia-detail-cards.yaml"        # Gap 5 — Phase 16
run_flow "$FLOWS_DIR/corte-con-diferencia.yaml"             # Audit — previously excluded
run_flow "$FLOWS_DIR/corte-historial-director.yaml"         # Audit — previously excluded

# ──────────────── Phase 9: Director features ───────────────────
CURRENT_PHASE="Phase 9: Director features"
echo ""
echo "📂  Phase 9: Director features"

if should_run "B"; then
  run_flow "$FLOWS_DIR/role-switch.yaml"
fi

run_flow "$FLOWS_DIR/director-home.yaml"
run_flow "$FLOWS_DIR/director-home-structure.yaml"          # Gap 10 — Phase 16
run_flow "$FLOWS_DIR/director-home-ver-ventas.yaml"         # Gap 23 — Phase 16

if should_run "D"; then
  # run_flow "$FLOWS_DIR/director-home-cxc-nav.yaml"         # (parked-mvp)
  run_flow "$FLOWS_DIR/director-home-utilidad-nav.yaml"
  run_flow "$FLOWS_DIR/director-home-stock-bajo.yaml"
  run_flow "$FLOWS_DIR/director-home-actividad.yaml"
  # run_flow "$FLOWS_DIR/director-home-cxc-strip.yaml"        # Audit (parked-mvp)
  run_flow "$FLOWS_DIR/director-to-ventas.yaml"             # Audit — previously excluded
fi

if should_run "B"; then
  run_flow "$FLOWS_DIR/estados-subtabs.yaml"
  run_flow "$FLOWS_DIR/estados-resultados-data.yaml"
  run_flow "$FLOWS_DIR/estados-resultados-all-rows.yaml"    # D1 — Phase 15
  run_flow "$FLOWS_DIR/estados-period-picker.yaml"          # Gap 7 — Phase 16
  run_flow "$FLOWS_DIR/estados-balance-data.yaml"
  run_flow "$FLOWS_DIR/balance-general-all-rows.yaml"       # D2 — Phase 15
  run_flow "$FLOWS_DIR/balance-general-pasivo.yaml"         # Gap 9 — Phase 16
  run_flow "$FLOWS_DIR/estados-flujo-efectivo.yaml"
  run_flow "$FLOWS_DIR/flujo-efectivo-all-rows.yaml"        # Gap 8 — Phase 16
  run_flow "$FLOWS_DIR/egresos-por-categoria-donut.yaml"    # B4 — Phase 15
  run_flow "$FLOWS_DIR/indicadores-screen.yaml"
fi

run_flow "$FLOWS_DIR/informe-mensual.yaml"

# ──────────────── Phase 9.5: Auth + Feature Flags (Phase 13) ────
if should_run "B"; then
  CURRENT_PHASE="Phase 9.5: Auth + Feature Flags"
  echo ""
  echo "📂  Phase 9.5: Auth + Feature Flags"
  run_flow "$FLOWS_DIR/quick-switch-login.yaml"
  run_flow "$FLOWS_DIR/funciones-toggle.yaml"
  run_flow "$FLOWS_DIR/otros-nav.yaml"
  run_flow "$FLOWS_DIR/otros-mvp-hidden-items.yaml"          # A1 — MVP absence test
  run_flow "$FLOWS_DIR/usuario-crear.yaml"
  run_flow "$FLOWS_DIR/caja-abrir-cerrar.yaml"
  # MVP-parked: merma flows moved to parked-mvp/
  # run_flow "$FLOWS_DIR/merma-registro.yaml"
  # run_flow "$FLOWS_DIR/merma-cancel-y-nota.yaml"
  # run_flow "$FLOWS_DIR/merma-stock-insuficiente.yaml"
  # run_flow "$FLOWS_DIR/merma-flag-off.yaml"
fi

if should_run "C"; then
  run_flow "$FLOWS_DIR/recovery-password.yaml"
  run_flow "$FLOWS_DIR/recovery-back-and-factory-reset.yaml" # Gap 20 — Phase 16
  run_flow "$FLOWS_DIR/funciones-stock-disabled.yaml"
  # change-password.yaml DELETED — ChangePassword screen removed by ADR-049.
  run_flow "$FLOWS_DIR/change-pin.yaml"                     # Audit — previously excluded
  run_flow "$FLOWS_DIR/change-pin-wrong-current.yaml"       # Audit — previously excluded
fi

# ──────────────── Phase 13: Coverage gap — flag cascades ──────
if should_run "A"; then
  CURRENT_PHASE="Phase 13: Flag cascades + user lifecycle"
  echo ""
  echo "📂  Phase 13: Flag cascades + user lifecycle"
  # MVP-parked: cascade/conversion/auditoria/merma flows moved to parked-mvp/
  # run_flow "$FLOWS_DIR/funciones-cascade-disable.yaml"
  # run_flow "$FLOWS_DIR/funciones-cant-enable-child.yaml"
  # run_flow "$FLOWS_DIR/funciones-conversion-auto-chain.yaml"
  # run_flow "$FLOWS_DIR/funciones-ventas-credito-toggle.yaml" # (parked-mvp)
  # run_flow "$FLOWS_DIR/otros-conversion-nav.yaml"
  # run_flow "$FLOWS_DIR/conversion-stock-insuficiente.yaml"
  # run_flow "$FLOWS_DIR/otros-auditoria-nav.yaml"
  run_flow "$FLOWS_DIR/otros-caja-reportes-nav.yaml"        # F3 — Phase 15
  # run_flow "$FLOWS_DIR/otros-ventas-credito-nav.yaml"       # Gap 14 — Phase 16 (parked-mvp)
  # run_flow "$FLOWS_DIR/otros-merma-reportes-nav.yaml"
fi

# ──────────────── Phase 13.5: User management lifecycle ───────
if should_run "A"; then
  CURRENT_PHASE="Phase 13.5: User management lifecycle"
  echo ""
  echo "📂  Phase 13.5: User management lifecycle"
  run_flow "$FLOWS_DIR/usuario-crear-cancel.yaml"           # Gap 19 — Phase 16
  run_flow "$FLOWS_DIR/usuario-multi-switch.yaml"
  run_flow "$FLOWS_DIR/usuario-last-director-guard.yaml"
  # usuario-eliminar runs AFTER multi-switch (needs the user to exist)
  run_flow "$FLOWS_DIR/usuario-eliminar.yaml"
fi

if should_run "D"; then
  run_flow "$FLOWS_DIR/usuario-wrong-password-lockout.yaml"
fi

# ──────────────── Phase 13.6: Caja edge cases ────────────────
if should_run "C"; then
  CURRENT_PHASE="Phase 13.6: Caja edge cases"
  echo ""
  echo "📂  Phase 13.6: Caja edge cases"
  run_flow "$FLOWS_DIR/caja-con-adicional.yaml"
  run_flow "$FLOWS_DIR/caja-cierre-discrepancia.yaml"
  run_flow "$FLOWS_DIR/caja-handoff.yaml"                   # Audit — previously excluded
  run_flow "$FLOWS_DIR/caja-movimiento-turno-cerrado.yaml"  # Edge — CAJ-13
  run_flow "$FLOWS_DIR/corte-duplicado-mismo-dia.yaml"      # Edge — CAJ-14
fi

# ──────────────── Phase 13.7: Error paths ─────────────────────
if should_run "D"; then
  CURRENT_PHASE="Phase 13.7: Error paths"
  echo ""
  echo "📂  Phase 13.7: Error paths"
  run_flow "$FLOWS_DIR/consent-modal-dismiss.yaml"
fi

# ──────────────── Phase 9.7: Notifications + Otros deep nav ────
if should_run "D"; then
  CURRENT_PHASE="Phase 9.7: Notifications + Otros deep nav"
  echo ""
  echo "📂  Phase 9.7: Notifications + Otros deep nav"
  run_flow "$FLOWS_DIR/director-notificaciones.yaml"        # Audit — previously excluded
  run_flow "$FLOWS_DIR/cancelaciones-nav.yaml"              # NEW — uncovered screen
  run_flow "$FLOWS_DIR/caja-movimientos-nav.yaml"           # NEW — uncovered screen
fi

# ──────────────── Phase 10: Settings ───────────────────────────
if should_run "B"; then
  CURRENT_PHASE="Phase 10: Settings"
  echo ""
  echo "📂  Phase 10: Settings"
  run_flow "$FLOWS_DIR/settings-hub-nav.yaml"
  run_flow "$FLOWS_DIR/settings-negocio-editar.yaml"
  run_flow "$FLOWS_DIR/settings-edit-business-isr.yaml"     # Gap 17 — Phase 16
  run_flow "$FLOWS_DIR/settings-sistema-cards.yaml"         # Gap 12 — Phase 16
  # run_flow "$FLOWS_DIR/otros-empleados-empty.yaml"         # Gap 18 — Phase 16 (parked-mvp)
  run_flow "$FLOWS_DIR/settings-funciones-nav.yaml"         # Audit — previously excluded
  run_flow "$FLOWS_DIR/settings-tipos-de-pago.yaml"         # NEW — uncovered screen
fi

if should_run "E"; then
  CURRENT_PHASE="Phase 10.5: Settings deep flows"
  echo ""
  echo "📂  Phase 10.5: Settings deep flows"
  run_flow "$FLOWS_DIR/settings-tasas-isr.yaml"
  run_flow "$FLOWS_DIR/settings-export-datos.yaml"
  run_flow "$FLOWS_DIR/advanced-backend-screen.yaml"        # H1 — Phase 15
  run_flow "$FLOWS_DIR/wizard-confirm-mode-change.yaml"     # H2 — Phase 15
  run_flow "$FLOWS_DIR/settings-check-updates.yaml"         # Audit — previously excluded
  run_flow "$FLOWS_DIR/bug-report-sheet.yaml"               # NEW — uncovered screen
fi

# ──────────────── Phase 11: Validation ─────────────────────────
if should_run "C"; then
  CURRENT_PHASE="Phase 11: Validation"
  echo ""
  echo "📂  Phase 11: Validation"
  run_flow "$FLOWS_DIR/validation-venta.yaml"
  run_flow "$FLOWS_DIR/validation-producto.yaml"
fi

# ──────────────── Phase 16: E2E Coverage Gap Remediation ──────
if should_run "E"; then
  CURRENT_PHASE="Phase 16: E2E coverage gap"
  echo ""
  echo "📂  Phase 16: E2E coverage gap — wizard edge cases"
  # Note: wizard-business-back requires fresh install state.
  # It's placed here as a standalone flow that can run after
  # a fresh-install script call in targeted execution.
  run_flow "$FLOWS_DIR/wizard-business-back.yaml"           # Gap 16 — Phase 16
fi

# ──────────────── Phase 12: Deletions (state-destroying — run last)
if should_run "A"; then
  CURRENT_PHASE="Phase 12: Deletions"
  echo ""
  echo "📂  Phase 12: Deletions (state-destroying — run last)"
  # PARKED 2026-09-07: tests the removed SessionStrip sales-list + venta-detail-popover UI
  #   (replaced by TotalBar; no layout renders `ventas-list`). Moved to flows/parked-mvp/.
  # run_flow "$FLOWS_DIR/eliminar-venta.yaml"
  run_flow "$FLOWS_DIR/eliminar-egreso.yaml"
  run_flow "$FLOWS_DIR/eliminar-egreso-via-popover.yaml"    # Audit — previously excluded
  run_flow "$FLOWS_DIR/eliminar-producto.yaml"
fi

# ──────────────── Phase W: Wizard edge cases (fresh install) ──
if should_run "W"; then
  CURRENT_PHASE="Phase W: Wizard edge cases"
  echo ""
  echo "📂  Phase W: Wizard edge cases (requires fresh install per flow)"
  for wiz in wizard-cloud-solo wizard-help-modal wizard-multi-branch \
             wizard-mobile-disabled-host wizard-rerun-with-data \
             wizard-join-existing-link wizard-business-full-form; do
    "$FRESH_SCRIPT" --install-only
    run_flow "$FLOWS_DIR/$wiz.yaml"
  done
  # Standalone flows that benefit from fresh state
  "$FRESH_SCRIPT" --install-only
  run_flow "$FLOWS_DIR/smoke-launch.yaml"
  "$FRESH_SCRIPT" --install-only
  run_flow "$FLOWS_DIR/crash-screen.yaml"
  run_flow "$FLOWS_DIR/a11y-smoke.yaml"
fi

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
