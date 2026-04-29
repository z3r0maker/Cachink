#!/usr/bin/env bash
# Pre-Maestro bundle sanity check.
# Runs a headless Metro bundle and fails on require-cycle warnings.
# Usage: pnpm --filter @cachink/mobile bundle:check
set -euo pipefail

OUTDIR=$(mktemp -d)
trap 'rm -rf "$OUTDIR"' EXIT

echo "▶ bundle:check — running headless Metro export..."
OUTPUT=$(npx expo export --platform ios --output-dir "$OUTDIR" 2>&1) || {
  echo "✗ Metro bundle failed:"
  echo "$OUTPUT"
  exit 1
}

# Check for require cycle warnings
CYCLES=$(echo "$OUTPUT" | grep -ci "require cycle" || true)
if [ "$CYCLES" -gt 0 ]; then
  echo "✗ Found $CYCLES require cycle warning(s):"
  echo "$OUTPUT" | grep -i "require cycle"
  exit 1
fi

# Check for other yellow-box warnings that Metro surfaces
WARNS=$(echo "$OUTPUT" | grep -ci "warn\|warning" || true)
if [ "$WARNS" -gt 0 ]; then
  echo "⚠ Found $WARNS warning(s) during bundle — review:"
  echo "$OUTPUT" | grep -i "warn\|warning"
  # Soft fail for now — change to `exit 1` once all warnings are cleaned
  echo "(non-blocking — review above)"
fi

echo "✓ bundle:check passed — zero require cycles"
