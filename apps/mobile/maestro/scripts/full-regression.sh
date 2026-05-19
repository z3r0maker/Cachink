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
# report in apps/mobile/maestro/reports/<flow-name>/.
#
# Usage:
#   ./apps/mobile/maestro/scripts/full-regression.sh
#
# Options:
#   --skip-fresh     Skip the database reset + wizard (assumes already done)
#   --phase A|B|C|D|E|W  Run only a specific phase (W = wizard with fresh-install)
#   --stop-on-fail   Stop immediately on first failure
#   --dry-run        Print the flow list without running
#   --open-reports   Open the reports directory in Finder after run
#   --device-class   Target a specific device class ("iphone" | "ipad")
# -------------------------------------------------------------------
set -euo pipefail

# Disable FloatingCoinsBackground animations — Maestro waits for
# animations to settle after each tap (~14s overhead without this).
export EXPO_PUBLIC_E2E=1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FLOWS_DIR="$(cd "$SCRIPT_DIR/../flows" && pwd)"
FRESH_SCRIPT="$SCRIPT_DIR/fresh-install.sh"
DIAGNOSE_SCRIPT="$SCRIPT_DIR/maestro-diagnose.sh"
REPORT_BASE="apps/mobile/maestro/reports"

# ───────────────────────── Parse flags ──────────────────────────
SKIP_FRESH=false
PHASE=""
STOP_ON_FAIL=false
DRY_RUN=false
OPEN_REPORTS=false
DEVICE_CLASS=""   # "iphone" | "ipad" — empty means use booted device

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-fresh)    SKIP_FRESH=true;       shift ;;
    --phase)         PHASE="$2";            shift 2 ;;
    --stop-on-fail)  STOP_ON_FAIL=true;     shift ;;
    --dry-run)       DRY_RUN=true;          shift ;;
    --open-reports)  OPEN_REPORTS=true;     shift ;;
    --device-class)  DEVICE_CLASS="$2";     shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ──────────── Resolve device UDID for the chosen class ──────────
# When --device-class ipad is passed, find the target iPad UDID and
# export MAESTRO_DEVICE_UDID so fresh-install.sh and every maestro
# test call targets the correct simulator.
if [[ -n "$DEVICE_CLASS" ]]; then
  DEVICE_PATTERN="${MAESTRO_IPAD_DEVICE:-iPad (10th generation)}"
  if [[ "$DEVICE_CLASS" == "iphone" ]]; then
    DEVICE_PATTERN="${MAESTRO_IPHONE_DEVICE:-iPhone 16}"
  fi

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
" 2>/dev/null || true) _RESOLVE_TARGET="$DEVICE_PATTERN"

  # Retry with python env var properly set
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
    echo "    Set MAESTRO_IPAD_DEVICE (or MAESTRO_IPHONE_DEVICE) to override."
    exit 1
  fi

  export MAESTRO_DEVICE_UDID="$RESOLVED_UDID"
  echo "🎯  Device class: $DEVICE_CLASS → $DEVICE_PATTERN ($RESOLVED_UDID)"

  # Boot the target simulator if not already booted.
  STATE=$(xcrun simctl list devices -j 2>/dev/null \
    | python3 -c "
import sys, json, os
data = json.load(sys.stdin)
udid = os.environ.get('MAESTRO_DEVICE_UDID', '')
for _, devs in data.get('devices', {}).items():
    for d in devs:
        if d.get('udid') == udid:
            print(d.get('state', 'Unknown'))
            sys.exit(0)
print('Unknown')
" 2>/dev/null || echo "Unknown")

  if [[ "$STATE" != "Booted" ]]; then
    echo "🔄  Booting $DEVICE_PATTERN..."
    xcrun simctl boot "$RESOLVED_UDID"
    xcrun simctl bootstatus "$RESOLVED_UDID" -b 2>/dev/null || sleep 8
  fi
fi

# Clean previous reports
rm -rf "$REPORT_BASE"
mkdir -p "$REPORT_BASE"

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

  if [[ "$DRY_RUN" == true ]]; then
    echo "  📋  $name"
    return 0
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🧪  $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  mkdir -p "$debug_dir"

  # Build optional --device flag (set by --device-class resolver above)
  local device_flag=()
  if [[ -n "${MAESTRO_DEVICE_UDID:-}" ]]; then
    device_flag=(--device "$MAESTRO_DEVICE_UDID")
  fi

  if maestro test --debug-output "$debug_dir" "${device_flag[@]+"${device_flag[@]}"}" "$flow"; then
    echo "  ✅  $name PASSED"
    PASSED=$((PASSED + 1))
    # Clean debug output for passing tests (save disk)
    rm -rf "$debug_dir"
  else
    echo "  ❌  $name FAILED"
    FAILED=$((FAILED + 1))
    FAILURES+=("$name")

    # Auto-diagnose: capture hierarchy + produce diagnostic report
    echo ""
    echo "  🔬  Running auto-diagnosis..."
    "$DIAGNOSE_SCRIPT" "$flow" "$debug_dir" || true

    if [[ "$STOP_ON_FAIL" == true ]]; then
      echo ""
      echo "⛔  Stopping on first failure (--stop-on-fail)."
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

# ──────────────── Phase 0: Fresh install + wizard ──────────────
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
  echo ""
  echo "📂  Phase 1: Empty states"
  run_flow "$FLOWS_DIR/empty-ventas.yaml"
  run_flow "$FLOWS_DIR/empty-productos.yaml"
  run_flow "$FLOWS_DIR/empty-estados.yaml"
  run_flow "$FLOWS_DIR/empty-egresos.yaml"                  # B2 — Phase 15
  run_flow "$FLOWS_DIR/empty-clientes.yaml"                 # A4 — Phase 15
fi

# ──────────────── Phase 2: Create baseline data ────────────────
echo ""
echo "📂  Phase 2: Create baseline data"
run_flow "$FLOWS_DIR/inventario-producto.yaml"
run_flow "$FLOWS_DIR/cliente-crear.yaml"
run_flow "$FLOWS_DIR/cliente-crear-full-form.yaml"          # Gap 6 — Phase 16

# ──────────────── Phase 3: Product management ──────────────────
if should_run "B"; then
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
  run_flow "$FLOWS_DIR/producto-uso-selector.yaml"        # Audit — previously excluded
fi

# ──────────────── Phase 4: Sales ───────────────────────────────
echo ""
echo "📂  Phase 4: Sales"
run_flow "$FLOWS_DIR/venta-efectivo.yaml"

if should_run "B"; then
  run_flow "$FLOWS_DIR/venta-manual.yaml"
  run_flow "$FLOWS_DIR/venta-otros-metodos.yaml"
fi

run_flow "$FLOWS_DIR/venta-credito.yaml"

if should_run "B"; then
  run_flow "$FLOWS_DIR/venta-comprobante.yaml"
fi

if should_run "C"; then
  run_flow "$FLOWS_DIR/venta-cantidad-multiple.yaml"
  run_flow "$FLOWS_DIR/venta-search-product.yaml"
  run_flow "$FLOWS_DIR/venta-detail-popover-inspect.yaml" # Audit — previously excluded
  run_flow "$FLOWS_DIR/checkout-method-picker.yaml"        # NEW — uncovered screen
fi

if should_run "A"; then
  run_flow "$FLOWS_DIR/editar-venta.yaml"
  run_flow "$FLOWS_DIR/editar-venta-full-form.yaml"         # Gap 2 — Phase 16
  run_flow "$FLOWS_DIR/ventas-total-y-fecha.yaml"           # Gap 1 — Phase 16
fi

# ──────────────── Phase 5: Egresos ─────────────────────────────
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
fi

if should_run "A"; then
  run_flow "$FLOWS_DIR/editar-egreso.yaml"
  run_flow "$FLOWS_DIR/editar-egreso-full-form.yaml"        # Gap 3 — Phase 16
  run_flow "$FLOWS_DIR/nuevo-egreso-cancel.yaml"            # Gap 21 — Phase 16
fi

# ──────────────── Phase 6: Employee management ─────────────────
if should_run "A"; then
  echo ""
  echo "📂  Phase 6: Employee management"
  run_flow "$FLOWS_DIR/empleado-editar.yaml"
  run_flow "$FLOWS_DIR/empleado-eliminar.yaml"
fi

# ──────────────── Phase 7: Clientes + CxC ─────────────────────
echo ""
echo "📂  Phase 7: Clientes + CxC"
run_flow "$FLOWS_DIR/cliente-buscar.yaml"                   # A2 — Phase 15
run_flow "$FLOWS_DIR/cliente-detail-screen.yaml"            # A1 — Phase 15
run_flow "$FLOWS_DIR/cliente-editar.yaml"                   # A3 — Phase 15
run_flow "$FLOWS_DIR/registrar-pago-full-form.yaml"         # H3 — Phase 15
run_flow "$FLOWS_DIR/cliente-pago-parcial.yaml"
run_flow "$FLOWS_DIR/cliente-pago-completo.yaml"
run_flow "$FLOWS_DIR/cliente-detail-empty-state.yaml"       # Gap 22 — Phase 16
run_flow "$FLOWS_DIR/cliente-crear-via-fab.yaml"            # Audit — previously excluded

# ──────────────── Phase 8: Corte de día ────────────────────────
echo ""
echo "📂  Phase 8: Corte de día"
run_flow "$FLOWS_DIR/corte-de-dia.yaml"
run_flow "$FLOWS_DIR/corte-de-dia-detail-cards.yaml"        # Gap 5 — Phase 16
run_flow "$FLOWS_DIR/corte-con-diferencia.yaml"             # Audit — previously excluded
run_flow "$FLOWS_DIR/corte-historial-director.yaml"         # Audit — previously excluded

# ──────────────── Phase 9: Director features ───────────────────
echo ""
echo "📂  Phase 9: Director features"

if should_run "B"; then
  run_flow "$FLOWS_DIR/role-switch.yaml"
fi

run_flow "$FLOWS_DIR/director-home.yaml"
run_flow "$FLOWS_DIR/director-home-structure.yaml"          # Gap 10 — Phase 16
run_flow "$FLOWS_DIR/director-home-ver-ventas.yaml"         # Gap 23 — Phase 16

if should_run "D"; then
  run_flow "$FLOWS_DIR/director-home-cxc-nav.yaml"
  run_flow "$FLOWS_DIR/director-home-utilidad-nav.yaml"
  run_flow "$FLOWS_DIR/director-home-stock-bajo.yaml"
  run_flow "$FLOWS_DIR/director-home-actividad.yaml"
  run_flow "$FLOWS_DIR/director-home-cxc-strip.yaml"        # Audit — previously excluded
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
  echo ""
  echo "📂  Phase 9.5: Auth + Feature Flags"
  run_flow "$FLOWS_DIR/quick-switch-login.yaml"
  run_flow "$FLOWS_DIR/funciones-toggle.yaml"
  run_flow "$FLOWS_DIR/otros-nav.yaml"
  run_flow "$FLOWS_DIR/usuario-crear.yaml"
  run_flow "$FLOWS_DIR/caja-abrir-cerrar.yaml"
  run_flow "$FLOWS_DIR/merma-registro.yaml"
  run_flow "$FLOWS_DIR/merma-cancel-y-nota.yaml"            # Gap 11 — Phase 16
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
  echo ""
  echo "📂  Phase 13: Flag cascades + user lifecycle"
  run_flow "$FLOWS_DIR/funciones-cascade-disable.yaml"
  run_flow "$FLOWS_DIR/funciones-cant-enable-child.yaml"
  run_flow "$FLOWS_DIR/funciones-conversion-auto-chain.yaml"
  run_flow "$FLOWS_DIR/funciones-ventas-credito-toggle.yaml"
  run_flow "$FLOWS_DIR/otros-conversion-nav.yaml"           # F1 — Phase 15
  run_flow "$FLOWS_DIR/otros-auditoria-nav.yaml"            # F2 — Phase 15
  run_flow "$FLOWS_DIR/otros-caja-reportes-nav.yaml"        # F3 — Phase 15
  run_flow "$FLOWS_DIR/otros-ventas-credito-nav.yaml"       # Gap 14 — Phase 16
  run_flow "$FLOWS_DIR/otros-merma-reportes-nav.yaml"       # Gap 15 — Phase 16
fi

# ──────────────── Phase 13.5: User management lifecycle ───────
if should_run "A"; then
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
  echo ""
  echo "📂  Phase 13.6: Caja edge cases"
  run_flow "$FLOWS_DIR/caja-con-adicional.yaml"
  run_flow "$FLOWS_DIR/caja-cierre-discrepancia.yaml"
  run_flow "$FLOWS_DIR/caja-handoff.yaml"                   # Audit — previously excluded
fi

# ──────────────── Phase 13.7: Error paths ─────────────────────
if should_run "D"; then
  echo ""
  echo "📂  Phase 13.7: Error paths"
  run_flow "$FLOWS_DIR/cloud-signup-error.yaml"
  run_flow "$FLOWS_DIR/consent-modal-dismiss.yaml"
fi

# ──────────────── Phase 9.7: Notifications + Otros deep nav ────
if should_run "D"; then
  echo ""
  echo "📂  Phase 9.7: Notifications + Otros deep nav"
  run_flow "$FLOWS_DIR/director-notificaciones.yaml"        # Audit — previously excluded
  run_flow "$FLOWS_DIR/cancelaciones-nav.yaml"              # NEW — uncovered screen
  run_flow "$FLOWS_DIR/caja-movimientos-nav.yaml"           # NEW — uncovered screen
fi

# ──────────────── Phase 10: Settings ───────────────────────────
if should_run "B"; then
  echo ""
  echo "📂  Phase 10: Settings"
  run_flow "$FLOWS_DIR/settings-hub-nav.yaml"
  run_flow "$FLOWS_DIR/settings-negocio-editar.yaml"
  run_flow "$FLOWS_DIR/settings-edit-business-isr.yaml"     # Gap 17 — Phase 16
  run_flow "$FLOWS_DIR/settings-sistema-cards.yaml"         # Gap 12 — Phase 16
  run_flow "$FLOWS_DIR/otros-empleados-empty.yaml"         # Gap 18 — Phase 16
  run_flow "$FLOWS_DIR/settings-funciones-nav.yaml"         # Audit — previously excluded
  run_flow "$FLOWS_DIR/settings-tipos-de-pago.yaml"         # NEW — uncovered screen
fi

if should_run "E"; then
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
  echo ""
  echo "📂  Phase 11: Validation"
  run_flow "$FLOWS_DIR/validation-venta.yaml"
  run_flow "$FLOWS_DIR/validation-producto.yaml"
fi

# ──────────────── Phase 16: E2E Coverage Gap Remediation ──────
if should_run "E"; then
  echo ""
  echo "📂  Phase 16: E2E coverage gap — wizard edge cases"
  # Note: wizard-business-back requires fresh install state.
  # It's placed here as a standalone flow that can run after
  # a fresh-install script call in targeted execution.
  run_flow "$FLOWS_DIR/wizard-business-back.yaml"           # Gap 16 — Phase 16
fi

# ──────────────── Phase 12: Deletions (state-destroying — run last)
if should_run "A"; then
  echo ""
  echo "📂  Phase 12: Deletions (state-destroying — run last)"
  run_flow "$FLOWS_DIR/eliminar-venta.yaml"
  run_flow "$FLOWS_DIR/eliminar-egreso.yaml"
  run_flow "$FLOWS_DIR/eliminar-egreso-via-popover.yaml"    # Audit — previously excluded
  run_flow "$FLOWS_DIR/eliminar-producto.yaml"
fi

# ──────────────── Phase W: Wizard edge cases (fresh install) ──
if should_run "W"; then
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

# Open reports directory in Finder if requested
if [[ "$OPEN_REPORTS" == true ]] && [[ $FAILED -gt 0 ]]; then
  echo ""
  echo "📂  Opening reports directory..."
  open "$REPORT_BASE" 2>/dev/null || true
fi

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi
