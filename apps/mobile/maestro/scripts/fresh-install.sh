#!/usr/bin/env bash
# -------------------------------------------------------------------
# fresh-install.sh — clean-slate app install for Maestro on iOS
#
# Replaces Maestro's `clearState: true` which on iOS 18+ / Expo SDK 55
# dev-clients wipes the stored Metro bundler URL, leaving the app
# unable to reconnect ("No script URL provided"). This script does
# an uninstall + reinstall instead, which gives a fresh SQLite
# database while preserving Metro connectivity.
#
# Usage:
#   # Run a single flow with clean state:
#   ./apps/mobile/maestro/scripts/fresh-install.sh \
#       apps/mobile/maestro/flows/smoke-launch.yaml
#
#   # Run multiple flows (first gets clean install, rest chain state):
#   ./apps/mobile/maestro/scripts/fresh-install.sh \
#       apps/mobile/maestro/flows/smoke-launch.yaml \
#       apps/mobile/maestro/flows/wizard-local-standalone.yaml
#
#   # Just reinstall (no maestro test):
#   ./apps/mobile/maestro/scripts/fresh-install.sh --install-only
# -------------------------------------------------------------------
set -euo pipefail

APP_ID="mx.cachink.mobile"

# Resolve the .app bundle path from DerivedData (Expo dev-client build).
# If APP_PATH is set in the environment, honour it.
if [[ -z "${APP_PATH:-}" ]]; then
  APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData \
    -path "*/Debug-iphonesimulator/Cachink.app" \
    -type d 2>/dev/null | head -1)
fi

if [[ -z "$APP_PATH" || ! -d "$APP_PATH" ]]; then
  echo "❌  Could not locate Cachink.app in DerivedData."
  echo "    Build the dev client first:  pnpm --filter @cachink/mobile ios"
  echo "    Or set APP_PATH=/path/to/Cachink.app"
  exit 1
fi

echo "🔄  Terminating $APP_ID…"
xcrun simctl terminate booted "$APP_ID" 2>/dev/null || true

echo "🗑️  Uninstalling $APP_ID…"
xcrun simctl uninstall booted "$APP_ID" 2>/dev/null || true

echo "📦  Installing from $APP_PATH…"
xcrun simctl install booted "$APP_PATH"

echo "✅  Clean install complete."

# If --install-only, stop here.
if [[ "${1:-}" == "--install-only" ]]; then
  exit 0
fi

# Run maestro test with all remaining arguments.
if [[ $# -gt 0 ]]; then
  echo "🚀  Running: maestro test $*"
  exec maestro test "$@"
else
  echo "ℹ️   No flow file specified. App is installed and ready."
  echo "    Run:  maestro test apps/mobile/maestro/flows/smoke-launch.yaml"
fi
