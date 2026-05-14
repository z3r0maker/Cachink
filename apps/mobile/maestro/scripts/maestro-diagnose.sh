#!/usr/bin/env bash
# -------------------------------------------------------------------
# maestro-diagnose.sh — post-failure diagnostic for Maestro tests.
#
# Captures the live view hierarchy, finds the failure artifacts
# (screenshot + commands JSON), and runs analyze-failure.py to
# produce a structured "expected vs actual" diagnostic report.
#
# Usage:
#   # After a failed `maestro test`:
#   ./apps/mobile/maestro/scripts/maestro-diagnose.sh <flow.yaml> [debug-output-dir]
#
#   # Called automatically by full-regression.sh on failure.
#
# Output:
#   apps/mobile/maestro/reports/<flow-name>/
#     ├── report.md         — the diagnostic report (printed to stdout too)
#     ├── screenshot.png    — failure screenshot
#     ├── commands.json     — step trace
#     └── hierarchy.json    — view hierarchy at time of diagnosis
# -------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANALYZER="$SCRIPT_DIR/analyze-failure.py"

FLOW="${1:?Usage: maestro-diagnose.sh <flow.yaml> [debug-output-dir]}"
DEBUG_DIR="${2:-}"
FLOW_NAME="$(basename "$FLOW" .yaml)"
REPORT_DIR="apps/mobile/maestro/reports/$FLOW_NAME"

mkdir -p "$REPORT_DIR"

# ──────────── 1. Capture the live view hierarchy ───────────────
# The screen is still frozen on the failure state, so this shows
# exactly what testIDs and text are visible right now.
echo "🔍  Capturing view hierarchy..."
if maestro hierarchy 2>/dev/null | tail -n +3 > "$REPORT_DIR/hierarchy.json" 2>/dev/null; then
  echo "   ✅ Hierarchy saved to $REPORT_DIR/hierarchy.json"
else
  echo "   ⚠️  Could not capture hierarchy (simulator may not be running)"
  echo "{}" > "$REPORT_DIR/hierarchy.json"
fi

# ──────────── 2. Find the debug output directory ───────────────
# If not provided, find the most recent Maestro debug output that
# contains artifacts for this flow.
if [[ -z "$DEBUG_DIR" ]]; then
  # Search ~/.maestro/tests for the latest directory with this flow's artifacts
  DEBUG_DIR=$(find ~/.maestro/tests -maxdepth 2 -name "commands-*${FLOW_NAME}*" -type f 2>/dev/null \
    | sort -r | head -1 | xargs dirname 2>/dev/null || true)

  if [[ -z "$DEBUG_DIR" ]]; then
    echo "   ⚠️  No debug output found for $FLOW_NAME in ~/.maestro/tests/"
    echo "      Run with: maestro test --debug-output <dir> $FLOW"
  fi
fi

# ──────────── 3. Copy artifacts to the report directory ────────
COMMANDS_SRC=""
SCREENSHOT_SRC=""

if [[ -n "$DEBUG_DIR" ]]; then
  # Find commands JSON — handle both flat and nested .maestro/tests/ layouts.
  # Maestro filenames include the .yaml extension: commands-(flow-name.yaml).json
  COMMANDS_SRC=$(find "$DEBUG_DIR" -name "commands-*${FLOW_NAME}*" -type f 2>/dev/null | head -1)
  # Screenshots may have emoji prefixes: screenshot-❌-<ts>-(flow-name.yaml).png
  SCREENSHOT_SRC=$(find "$DEBUG_DIR" -name "screenshot-*" -type f 2>/dev/null | grep -i "${FLOW_NAME}" | head -1)
  # Fallback: if no flow-name match, take any screenshot in the directory
  if [[ -z "$SCREENSHOT_SRC" ]]; then
    SCREENSHOT_SRC=$(find "$DEBUG_DIR" -name "screenshot-*.png" -type f 2>/dev/null | head -1)
  fi
fi

if [[ -n "$COMMANDS_SRC" ]]; then
  cp "$COMMANDS_SRC" "$REPORT_DIR/commands.json"
  echo "   ✅ Commands trace: $REPORT_DIR/commands.json"
else
  echo "   ⚠️  Commands JSON not found"
  echo "[]" > "$REPORT_DIR/commands.json"
fi

if [[ -n "$SCREENSHOT_SRC" ]]; then
  cp "$SCREENSHOT_SRC" "$REPORT_DIR/screenshot.png"
  echo "   ✅ Screenshot: $REPORT_DIR/screenshot.png"
else
  echo "   ⚠️  Failure screenshot not found"
fi

# ──────────── 4. Run the Python analyzer ───────────────────────
echo ""
python3 "$ANALYZER" \
  --flow "$FLOW" \
  --commands "$REPORT_DIR/commands.json" \
  --hierarchy "$REPORT_DIR/hierarchy.json" \
  --screenshot "$REPORT_DIR/screenshot.png" \
  --output "$REPORT_DIR/report.md"
