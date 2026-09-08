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
#   ./apps/mobile/maestro/scripts/maestro-diagnose.sh <flow.yaml> [debug-output-dir] [target-dir]
#
#   # Called automatically by full-regression.sh on failure.
#   # When target-dir is provided, artifacts are written there
#   # (e2e-reports/runs/<run>/tests/<flow>/) for the HTML report.
#
# Output:
#   <target-dir>/ (or apps/mobile/maestro/reports/<flow-name>/):
#     ├── report.md         — the diagnostic report (printed to stdout too)
#     ├── screenshot.png    — failure screenshot
#     ├── commands.json     — step trace
#     └── hierarchy.json    — view hierarchy at time of diagnosis
# -------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANALYZER="$SCRIPT_DIR/analyze-failure.py"

FLOW="${1:?Usage: maestro-diagnose.sh <flow.yaml> [debug-output-dir] [target-dir]}"
DEBUG_DIR="${2:-}"
TARGET_DIR="${3:-}"
FLOW_NAME="$(basename "$FLOW" .yaml)"

# Use target-dir if provided (e2e-report run dir), otherwise fall back to legacy path
if [[ -n "$TARGET_DIR" ]]; then
  REPORT_DIR="$TARGET_DIR"
else
  REPORT_DIR="apps/mobile/maestro/reports/$FLOW_NAME"
fi

mkdir -p "$REPORT_DIR"

# ──────────── 1. Capture the live view hierarchy ───────────────
# The screen is still frozen on the failure state, so this shows
# exactly what testIDs and text are visible right now.
#
# Two hard-won details:
#
#   --device: `--udid/--device` is a GLOBAL maestro option, so it must
#   precede the subcommand. Without it, `maestro hierarchy` has to guess
#   the target; with more than one booted simulator it can dump the WRONG
#   device, or block forever waiting on a driver that never connects.
#
#   timeout: this call used to be unbounded. A hung driver would wedge the
#   entire regression here — observed 2026-09-07 hanging 46 min mid-run,
#   with the suite making no progress. macOS ships no `timeout(1)`, so
#   run it in the background and kill it if it overruns.
HIER_TIMEOUT="${MAESTRO_HIERARCHY_TIMEOUT:-45}"
echo "🔍  Capturing view hierarchy..."

# A real hierarchy dump is ~30-450 KB. Anything past this is not data.
# With two simulators booted and no --device, maestro prompts for a device,
# gets EOF on stdin, and loops forever at ~20 MB/s: on 2026-09-07 that wrote
# a 62 GB "hierarchy.json" of prompt text. The --device flag above is the
# real fix; this cap is the seatbelt.
HIER_MAX_BYTES="${MAESTRO_HIERARCHY_MAX_BYTES:-16777216}"   # 16 MB

capture_hierarchy() {
  local dest="$1" raw="$1.raw" pid waited=0 size=0
  maestro ${MAESTRO_DEVICE_UDID:+--device "$MAESTRO_DEVICE_UDID"} hierarchy \
    </dev/null >"$raw" 2>/dev/null &
  pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    size=$(stat -f %z "$raw" 2>/dev/null || echo 0)
    if (( size > HIER_MAX_BYTES )); then
      echo "   ⚠️  Hierarchy output exceeded $((HIER_MAX_BYTES/1048576))MB — aborting (device prompt loop?)"
      kill -9 "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      rm -f "$raw"
      return 1
    fi
    if (( waited >= HIER_TIMEOUT )); then
      kill -9 "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      rm -f "$raw"
      return 1
    fi
    sleep 1
    waited=$((waited + 1))
  done
  wait "$pid" 2>/dev/null || true
  # Strip maestro's banner lines by starting at the first JSON object,
  # rather than a fixed `tail -n +3` that breaks when the banner changes.
  sed -n '/^[[:space:]]*{/,$p' "$raw" > "$dest" 2>/dev/null
  rm -f "$raw"
  python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$dest" 2>/dev/null
}

if capture_hierarchy "$REPORT_DIR/hierarchy.json"; then
  echo "   ✅ Hierarchy saved to $REPORT_DIR/hierarchy.json"
else
  echo "   ⚠️  Could not capture hierarchy (timed out after ${HIER_TIMEOUT}s, or simulator not running)"
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
