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

# ─────────────────── Verify the app is installed ────────────────
APP_DATA=$(xcrun simctl get_app_container booted "$APP_ID" data 2>/dev/null || true)

if [[ -z "$APP_DATA" ]]; then
  echo "❌  $APP_ID is not installed on the booted simulator."
  echo "    Run first:  cd apps/mobile && npx expo run:ios"
  exit 1
fi

# ────────────────── Optionally kill the app first ───────────────
if [[ "$KILL_APP" == true ]]; then
  echo "🔪  Terminating $APP_ID on the booted simulator..."
  xcrun simctl terminate booted "$APP_ID" 2>/dev/null || true
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

if [[ $# -gt 0 ]]; then
  ATTEMPT=1
  while [[ $ATTEMPT -le $MAX_RETRIES ]]; do
    echo "🚀  Attempt $ATTEMPT/$MAX_RETRIES: maestro test $*"
    if maestro test "$@"; then
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
