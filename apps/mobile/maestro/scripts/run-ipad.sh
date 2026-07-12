#!/usr/bin/env bash
# -------------------------------------------------------------------
# run-ipad.sh — Maestro runner targeting a named iPad simulator
#
# Mirrors fresh-install.sh (DB-only reset, Metro URL preserved) but
# resolves a named iPad simulator by display name, boots it if needed,
# and passes --device <udid> to every `maestro test` call so runs are
# deterministic even when both iPhone and iPad simulators are booted.
#
# IMPORTANT: The Cachink dev client must be installed on the iPad
# simulator before this script can run. One-time setup per device:
#
#   pnpm --filter @cachink/mobile ios -- --device "iPad (10th generation)"
#
# After that initial install the binary stays on the simulator; you
# only need to reinstall when upgrading the Expo SDK or resetting Xcode.
#
# Usage:
#   # Boot iPad + reset DB + run a flow:
#   ./apps/mobile/maestro/scripts/run-ipad.sh \
#       apps/mobile/maestro/flows/ipad-smoke.yaml
#
#   # Boot + reset DB only (no test):
#   ./apps/mobile/maestro/scripts/run-ipad.sh --install-only
#
#   # Kill the running app before reset (helps when Metro is stuck):
#   ./apps/mobile/maestro/scripts/run-ipad.sh --kill \
#       apps/mobile/maestro/flows/ipad-smoke.yaml
#
#   # Override the default iPad model:
#   MAESTRO_IPAD_DEVICE="iPad Pro 13-inch (M4)" \
#       ./apps/mobile/maestro/scripts/run-ipad.sh \
#       apps/mobile/maestro/flows/ipad-smoke.yaml
#
# Env vars:
#   MAESTRO_IPAD_DEVICE  Display name of the target iPad simulator.
#                        Default: "iPad (10th generation)"
#   MAESTRO_EXCLUSIVE    Set to 1 to terminate all booted iPhone
#                        simulators before booting the iPad (avoids
#                        Maestro picking the wrong device when both
#                        form factors are booted simultaneously).
# -------------------------------------------------------------------
set -euo pipefail

APP_ID="mx.cachink.mobile"
IPAD_DEVICE="${MAESTRO_IPAD_DEVICE:-iPad (10th generation)}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIAGNOSE_SCRIPT="$SCRIPT_DIR/maestro-diagnose.sh"
REPORT_COLLECT="$SCRIPT_DIR/report-collect.py"
REPORT_FINALIZE="$SCRIPT_DIR/report-finalize.py"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
REPORT_ROOT="$REPO_ROOT/e2e-reports"
EXCLUSIVE="${MAESTRO_EXCLUSIVE:-0}"
MAX_RETRIES=10
RETRY_INTERVAL=2

# ───────────────────────── Parse flags ──────────────────────────
INSTALL_ONLY=false
KILL_APP=false
POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install-only) INSTALL_ONLY=true; shift ;;
    --kill)         KILL_APP=true;     shift ;;
    *)              POSITIONAL_ARGS+=("$1"); shift ;;
  esac
done

set -- "${POSITIONAL_ARGS[@]+"${POSITIONAL_ARGS[@]}"}"

# ──────────────── Resolve iPad UDID from display name ───────────
echo "📱  Target: $IPAD_DEVICE"

IPAD_UDID=$(xcrun simctl list devices available -j 2>/dev/null \
  | python3 - <<'PYEOF'
import sys, json, os
target = os.environ.get("_IPAD_TARGET", "")
data = json.load(sys.stdin)
for runtime, devices in data.get("devices", {}).items():
    for d in devices:
        if target.lower() in d.get("name", "").lower():
            print(d["udid"])
            sys.exit(0)
PYEOF
)

if [[ -z "$IPAD_UDID" ]]; then
  echo "❌  Could not find an available simulator matching '$IPAD_DEVICE'."
  echo ""
  echo "    Available iPad simulators:"
  xcrun simctl list devices available | grep -i ipad | sed 's/^/      /' || true
  echo ""
  echo "    Override:  MAESTRO_IPAD_DEVICE='iPad Pro 13-inch (M4)' $0 ..."
  exit 1
fi
export _IPAD_TARGET="$IPAD_DEVICE"

echo "    UDID: $IPAD_UDID"

# ──────────── Optionally shut down iPhone simulators ────────────
if [[ "$EXCLUSIVE" == "1" ]]; then
  echo "🔇  MAESTRO_EXCLUSIVE=1 — shutting down other simulators..."
  xcrun simctl list devices booted -j 2>/dev/null \
    | python3 -c "
import sys, json
data = json.load(sys.stdin)
for _, devs in data.get('devices', {}).items():
    for d in devs:
        if d.get('state') == 'Booted' and d['udid'] != '$IPAD_UDID':
            import subprocess
            subprocess.run(['xcrun', 'simctl', 'shutdown', d['udid']])
            print(f'  shutdown {d[\"name\"]} ({d[\"udid\"]})')
" 2>/dev/null || true
fi

# ──────────────── Boot the iPad if not already booted ───────────
DEVICE_STATE=$(xcrun simctl list devices -j 2>/dev/null \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
for _, devs in data.get('devices', {}).items():
    for d in devs:
        if d['udid'] == '$IPAD_UDID':
            print(d.get('state', 'Unknown'))
            sys.exit(0)
print('Unknown')
" 2>/dev/null || echo "Unknown")

if [[ "$DEVICE_STATE" != "Booted" ]]; then
  echo "🔄  Booting $IPAD_DEVICE ($IPAD_UDID)..."
  xcrun simctl boot "$IPAD_UDID"
  # bootstatus -b blocks until SpringBoard is ready (Xcode 14+)
  xcrun simctl bootstatus "$IPAD_UDID" -b 2>/dev/null || sleep 8
  echo "    Boot complete."
else
  echo "    Already booted."
fi

# ─────────────────── Verify the app is installed ────────────────
APP_DATA=$(xcrun simctl get_app_container "$IPAD_UDID" "$APP_ID" data 2>/dev/null || true)

if [[ -z "$APP_DATA" ]]; then
  echo "❌  $APP_ID is not installed on $IPAD_DEVICE."
  echo ""
  echo "    First-time setup (one-time per device class):"
  echo "      pnpm --filter @cachink/mobile ios -- --device \"$IPAD_DEVICE\""
  exit 1
fi

# ────────────────── Optionally kill the running app ─────────────
if [[ "$KILL_APP" == true ]]; then
  echo "🔪  Terminating $APP_ID on $IPAD_DEVICE..."
  xcrun simctl terminate "$IPAD_UDID" "$APP_ID" 2>/dev/null || true
  sleep 1
fi

# ──────────────────── Reset the SQLite database ─────────────────
DB_DIR="$APP_DATA/Documents/SQLite"
DB_FILE="$DB_DIR/cachink.db"

echo "🗑️  Deleting database: $DB_FILE"
rm -f "$DB_FILE" "${DB_FILE}-wal" "${DB_FILE}-shm" 2>/dev/null || true
rm -f "$DB_DIR"/*.db-journal 2>/dev/null || true
echo "✅  Database cleared. Dev-client Metro URL preserved."

# ────────────────────── --install-only exit ─────────────────────
if [[ "$INSTALL_ONLY" == true ]]; then
  echo ""
  echo "ℹ️   iPad is booted and database is reset. Ready for testing."
  echo "    Run a single flow:"
  echo "      MAESTRO_DEVICE_UDID=$IPAD_UDID maestro test \\"
  echo "          apps/mobile/maestro/flows/ipad-smoke.yaml"
  echo ""
  echo "    Run the full regression on iPad:"
  echo "      ./apps/mobile/maestro/scripts/full-regression.sh --device-class ipad"
  exit 0
fi

# ──────────────── Verify Metro bundler is reachable ─────────────
METRO_URL="http://localhost:8081/status"
if ! curl -sf --connect-timeout 3 "$METRO_URL" >/dev/null 2>&1; then
  echo "⚠️   Metro bundler not responding at $METRO_URL."
  echo "    Start Metro first:  cd apps/mobile && npx expo start"
  echo "    Proceeding anyway — the dev-client may reconnect on its own."
fi

# ─────────────────── Run Maestro with retry + report ────────────
if [[ $# -gt 0 ]]; then
  # Create run directory for E2E report
  RUN_ID="$(date +%Y-%m-%d_%H%M)_ipad"
  RUN_DIR="$REPORT_ROOT/runs/$RUN_ID"
  mkdir -p "$RUN_DIR/tests"

  # Trap handler: finalize partial report on interrupt
  finalize_on_exit() {
    python3 "$REPORT_FINALIZE" --run-dir "$RUN_DIR" --report-root "$REPORT_ROOT" --interrupted 2>/dev/null || true
  }
  trap finalize_on_exit INT TERM

  FLOW_PATH="$1"
  FLOW_NAME="$(basename "$FLOW_PATH" .yaml)"
  ATTEMPT=1
  while [[ $ATTEMPT -le $MAX_RETRIES ]]; do
    echo ""
    echo "🚀  Attempt $ATTEMPT/$MAX_RETRIES:"
    echo "    maestro test --device $IPAD_UDID $*"

    debug_dir="$RUN_DIR/tests/$FLOW_NAME/debug"
    test_dir="$RUN_DIR/tests/$FLOW_NAME"
    mkdir -p "$debug_dir" "$test_dir"
    start_seconds=$SECONDS

    if maestro test --debug-output "$debug_dir" --device "$IPAD_UDID" "$@"; then
      elapsed_ms=$(( (SECONDS - start_seconds) * 1000 ))
      echo "✅  Flow passed on attempt $ATTEMPT. (${elapsed_ms}ms)"

      python3 "$REPORT_COLLECT" \
        --run-dir "$RUN_DIR" --flow "$FLOW_PATH" --status passed \
        --duration-ms "$elapsed_ms" --debug-dir "$debug_dir" || true
      rm -rf "$debug_dir"

      python3 "$REPORT_FINALIZE" --run-dir "$RUN_DIR" --report-root "$REPORT_ROOT" || true
      echo "🌐  HTML Report: $REPORT_ROOT/index.html"
      exit 0
    fi

    elapsed_ms=$(( (SECONDS - start_seconds) * 1000 ))

    if [[ $ATTEMPT -lt $MAX_RETRIES ]]; then
      echo "⚠️   Attempt $ATTEMPT failed. Retrying in ${RETRY_INTERVAL}s..."
      # Clean partial debug output before retry
      rm -rf "$debug_dir" "$test_dir"
      sleep "$RETRY_INTERVAL"
    else
      # Last attempt failed — diagnose and collect
      echo "  🔬  Running auto-diagnosis..."
      "$DIAGNOSE_SCRIPT" "$FLOW_PATH" "$debug_dir" "$test_dir" || true

      python3 "$REPORT_COLLECT" \
        --run-dir "$RUN_DIR" --flow "$FLOW_PATH" --status failed \
        --duration-ms "$elapsed_ms" --debug-dir "$debug_dir" || true
    fi
    ATTEMPT=$((ATTEMPT + 1))
  done

  python3 "$REPORT_FINALIZE" --run-dir "$RUN_DIR" --report-root "$REPORT_ROOT" || true
  echo "🌐  HTML Report: $REPORT_ROOT/index.html"
  echo "📂  Opening report in browser..."
  open "$REPORT_ROOT/index.html" 2>/dev/null || true

  echo "❌  All $MAX_RETRIES attempts failed."
  exit 1
else
  echo "ℹ️   No flow file specified. iPad is booted and database is reset."
  echo "    Run a single flow:"
  echo "      MAESTRO_DEVICE_UDID=$IPAD_UDID maestro test \\"
  echo "          apps/mobile/maestro/flows/ipad-smoke.yaml"
fi
