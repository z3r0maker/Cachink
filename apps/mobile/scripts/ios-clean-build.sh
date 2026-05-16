#!/bin/bash
# Clean iOS build: nuke Pods + DerivedData + rebuild.
# Usage: ./scripts/ios-clean-build.sh [--device UDID]
set -euo pipefail

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"
IOS_DIR="$MOBILE_DIR/ios"

DEVICE_FLAG=""
if [ "${1:-}" = "--device" ] && [ -n "${2:-}" ]; then
  DEVICE_FLAG="--device $2"
fi

echo "🧹 Cleaning iOS build artifacts..."
rm -rf "$IOS_DIR/build"
rm -rf "$IOS_DIR/Pods"
rm -f  "$IOS_DIR/Podfile.lock"

echo "📦 Installing Pods..."
cd "$IOS_DIR"
if command -v bundle &>/dev/null && [ -f "$MOBILE_DIR/Gemfile" ]; then
  bundle exec pod install
else
  pod install
fi

echo "🔨 Building..."
cd "$MOBILE_DIR"
# shellcheck disable=SC2086
npx expo run:ios $DEVICE_FLAG

echo "✅ Done"
