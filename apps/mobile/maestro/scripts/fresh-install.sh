#!/usr/bin/env bash
# -------------------------------------------------------------------
# fresh-install.sh — clean-slate database reset for Maestro on iOS
#
# Instead of uninstalling the app or using Maestro's `clearState`
# (both break the Expo dev-client's stored Metro URL on iOS 18+ /
# SDK 55), this script deletes only the SQLite database file from
# the app's container. The app stays installed so the Metro
# connection is preserved.
#
# IMPORTANT: the app must have been launched at least once via
# `expo run:ios` or `npx expo start` so the dev-client has cached
# the Metro bundler URL. After that, this script + Maestro's
# `launchApp` will reconnect automatically.
#
# Usage:
#   # Run a single flow with clean database:
#   ./apps/mobile/maestro/scripts/fresh-install.sh \
#       apps/mobile/maestro/flows/smoke-launch.yaml
#
#   # Just reset the database (no maestro test):
#   ./apps/mobile/maestro/scripts/fresh-install.sh --reset-only
#
#   # Kill the app before resetting (helpful when Metro gets stuck):
#   ./apps/mobile/maestro/scripts/fresh-install.sh --kill \
#       apps/mobile/maestro/flows/smoke-launch.yaml
# -------------------------------------------------------------------
set -euo pipefail

APP_ID="mx.cachink.mobile"
MAX_RETRIES=10
RETRY_INTERVAL=2  # seconds

# ───────────────────────── Parse flags ──────────────────────────
KILL_APP=false
RESET_ONLY=false
POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --kill)
      KILL_APP=true
      shift
      ;;
    --reset-only)
      RESET_ONLY=true
      shift
      ;;
    *)
      POSITIONAL_ARGS+=("$1")
      shift
      ;;
  esac
done

set -- "${POSITIONAL_ARGS[@]+"${POSITIONAL_ARGS[@]}"}"

# ──────────── Resolve target device (UDID or "booted") ──────────
# Set MAESTRO_DEVICE_UDID to target a specific simulator (e.g. an
# iPad) instead of whatever happens to be booted. run-ipad.sh sets
# this automatically; callers can also set it manually.
if [[ -n "${MAESTRO_DEVICE_UDID:-}" ]]; then
  SIM_TARGET="$MAESTRO_DEVICE_UDID"
  # Resolve the display name for log output.
  SIM_NAME=$(xcrun simctl list devices -j 2>/dev/null \
    | python3 -c "
import sys, json, os
data = json.load(sys.stdin)
udid = os.environ.get('MAESTRO_DEVICE_UDID', '')
for _, devs in data.get('devices', {}).items():
    for d in devs:
        if d.get('udid') == udid:
            print(d.get('name', udid))
            sys.exit(0)
print(udid)
" 2>/dev/null || echo "$MAESTRO_DEVICE_UDID")
  echo "🎯  Device: $SIM_NAME ($MAESTRO_DEVICE_UDID)"
else
  SIM_TARGET="booted"
  echo "🎯  Device: booted simulator (set MAESTRO_DEVICE_UDID to pin a specific device)"
fi

# ─────────────────── Verify the app is installed ────────────────
APP_DATA=$(xcrun simctl get_app_container "$SIM_TARGET" "$APP_ID" data 2>/dev/null || true)

if [[ -z "$APP_DATA" ]]; then
  echo "❌  $APP_ID is not installed on the target simulator."
  echo "    Run first:  cd apps/mobile && npx expo run:ios"
  exit 1
fi

# ────────────────── Optionally kill the app first ───────────────
if [[ "$KILL_APP" == true ]]; then
  echo "🔪  Terminating $APP_ID on $SIM_TARGET..."
  xcrun simctl terminate "$SIM_TARGET" "$APP_ID" 2>/dev/null || true
  sleep 1
fi

# ──────────────────── Delete the SQLite database ────────────────
DB_DIR="$APP_DATA/Documents/SQLite"
DB_FILE="$DB_DIR/cachink.db"

echo "🗑️  Deleting database: $DB_FILE"
rm -f "$DB_FILE" "${DB_FILE}-wal" "${DB_FILE}-shm" 2>/dev/null || true

# Also clean any stale migration marker or app_config cache that
# expo-sqlite may leave outside the WAL files.
rm -f "$DB_DIR"/*.db-journal 2>/dev/null || true

echo "✅  Database cleared. App stays installed (Metro URL preserved)."

# ────────────────────── --reset-only exit ───────────────────────
if [[ "$RESET_ONLY" == true ]]; then
  exit 0
fi

# ──────────────── Verify Metro bundler is reachable ─────────────
# The dev-client caches the Metro URL. If Metro isn't running, the
# app will launch but show a red error screen instead of our UI.
# Quick probe — allow 3 s connect timeout, don't block long.
METRO_URL="http://localhost:8081/status"
if ! curl -sf --connect-timeout 3 "$METRO_URL" >/dev/null 2>&1; then
  echo "⚠️   Metro bundler not responding at $METRO_URL."
  echo "    Start Metro first:  cd apps/mobile && npx expo start"
  echo "    Proceeding anyway — the dev-client may reconnect on its own."
fi

# ──────── Force dev-client to reconnect to localhost Metro ──────
# The Expo dev-client caches the last Metro URL it connected to.
# If the network IP changed (VPN, Wi-Fi switch, etc.), the cached
# URL becomes stale and the app shows the dev-client launcher
# instead of loading the JS bundle. We fix this by opening the
# dev-client deep link with the explicit localhost URL, waiting
# for the bundle to load, then terminating the app so Maestro's
# `launchApp` gets a clean cold start.
DEV_CLIENT_URL="exp+cachink://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
echo "🔗  Reconnecting dev-client to localhost:8081..."
xcrun simctl terminate "$SIM_TARGET" "$APP_ID" 2>/dev/null || true
xcrun simctl openurl "$SIM_TARGET" "$DEV_CLIENT_URL" 2>/dev/null || true
sleep 5
xcrun simctl terminate "$SIM_TARGET" "$APP_ID" 2>/dev/null || true
echo "✅  Dev-client primed with localhost Metro URL."

# ─────────────────── Run Maestro with retry ─────────────────────
# After deleting the DB the app needs to relaunch + run migrations
# before the UI is interactive. Maestro's `launchApp` triggers a
# cold start, but occasionally the first connection attempt fails
# because:
#   1. Metro needs to rebundle after the app restarts.
#   2. The migration runner needs a moment before the UI mounts.
#
# We retry the Maestro test up to MAX_RETRIES times to handle
# transient Metro-reconnection failures.

# Build optional --device flag for maestro test
MAESTRO_DEVICE_FLAG=()
if [[ -n "${MAESTRO_DEVICE_UDID:-}" ]]; then
  MAESTRO_DEVICE_FLAG=(--device "$MAESTRO_DEVICE_UDID")
fi

if [[ $# -gt 0 ]]; then
  ATTEMPT=1
  while [[ $ATTEMPT -le $MAX_RETRIES ]]; do
    echo "🚀  Attempt $ATTEMPT/$MAX_RETRIES: maestro test ${MAESTRO_DEVICE_FLAG[*]+"${MAESTRO_DEVICE_FLAG[*]}"} $*"
    if maestro test "${MAESTRO_DEVICE_FLAG[@]+"${MAESTRO_DEVICE_FLAG[@]}"}" "$@"; then
      echo "✅  Flow passed on attempt $ATTEMPT."
      exit 0
    fi

    if [[ $ATTEMPT -lt $MAX_RETRIES ]]; then
      echo "⚠️   Attempt $ATTEMPT failed. Retrying in ${RETRY_INTERVAL}s..."
      sleep "$RETRY_INTERVAL"
    fi
    ATTEMPT=$((ATTEMPT + 1))
  done

  echo "❌  All $MAX_RETRIES attempts failed."
  exit 1
else
  echo "ℹ️   No flow file specified. Database is reset and ready."
  echo "    Run:  maestro test apps/mobile/maestro/flows/smoke-launch.yaml"
fi
