#!/usr/bin/env bash
# -------------------------------------------------------------------
# fold-audit.sh — detect "false bottom" screens after a flow completes.
#
#   fold-audit.sh <flow.yaml> <target-dir>
#
# Captures the view hierarchy, scrolls the screen to its bottom, captures
# again, and diffs. Elements that appear only in the second dump are
# content the user cannot reach without scrolling — and unlike a
# screenshot, they come out NAMED.
#
# Why the diff is necessary: `maestro hierarchy` clamps the reported tree
# to the viewport (measured: 6,355 nodes across 44 dumps, ZERO below the
# fold), so a single dump can never reveal below-fold content.
#
# Writes <target-dir>/fold-audit.json. Always exits 0 — this is a
# diagnostic side-effect, never a gate on the suite.
#
# Env:
#   FOLD_AUDIT=0|1        master switch (default 0 — opt in)
#   FOLD_SCROLL_STEPS     unused for now; scroll-probe.yaml uses a fixed 6
#   FOLD_AUDIT_TIMEOUT    per-maestro-call seconds (default 60)
# -------------------------------------------------------------------
set -euo pipefail

FLOW="${1:-}"
TARGET_DIR="${2:-}"
[[ -n "$FLOW" && -n "$TARGET_DIR" ]] || { echo "usage: fold-audit.sh <flow.yaml> <target-dir>" >&2; exit 0; }
[[ "${FOLD_AUDIT:-0}" == "1" ]] || exit 0

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FLOWS_DIR="$(cd "$SCRIPT_DIR/../flows" && pwd)"
FLOW_NAME="$(basename "$FLOW" .yaml)"
AUDIT_TIMEOUT="${FOLD_AUDIT_TIMEOUT:-60}"

# shellcheck source=lib/with-timeout.sh
source "$SCRIPT_DIR/lib/with-timeout.sh"
# shellcheck source=lib/device-resolve.sh
source "$SCRIPT_DIR/lib/device-resolve.sh"

mkdir -p "$TARGET_DIR/fold"

# ──────────── Device safety ───────────────────────────────────────
# Non-negotiable. `--device` is a GLOBAL maestro option and MUST precede
# the subcommand. Without it, and with more than one simulator booted,
# maestro prompts for a device; headless it reads EOF, re-prompts, and
# loops forever at ~20 MB/s. That wrote a 62 GB "hierarchy.json" on
# 2026-09-07 and exhausted system swap. See lib/device-resolve.sh.
if ! assert_device_unambiguous; then
  echo "  ⚠️   Fold audit skipped: ambiguous device."
  exit 0
fi
DEV=()
[[ -n "${MAESTRO_DEVICE_UDID:-}" ]] && DEV=(--device "$MAESTRO_DEVICE_UDID")

# A real dump is 30-450 KB. Anything past this is not data.
HIER_MAX_BYTES="${MAESTRO_HIERARCHY_MAX_BYTES:-16777216}"

# ──────────── Hierarchy capture ───────────────────────────────────
capture() {   # $1 = destination path
  local dest="$1" raw="$1.raw" pid waited=0 size=0
  maestro "${DEV[@]+"${DEV[@]}"}" hierarchy </dev/null >"$raw" 2>/dev/null &
  pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    size=$(stat -f %z "$raw" 2>/dev/null || echo 0)
    if (( size > HIER_MAX_BYTES )) || (( waited >= AUDIT_TIMEOUT )); then
      kill -9 "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      rm -f "$raw"
      return 1
    fi
    sleep 1
    waited=$((waited + 1))
  done
  wait "$pid" 2>/dev/null || true
  # Strip maestro's banner by starting at the first JSON object, rather
  # than a fixed `tail -n +3` that breaks when the banner changes.
  sed -n '/^[[:space:]]*{/,$p' "$raw" > "$dest" 2>/dev/null
  rm -f "$raw"
  python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$dest" 2>/dev/null
}

echo "  🔍  Fold audit: capturing before-scroll hierarchy..."
if ! capture "$TARGET_DIR/fold/hierarchy-before.json"; then
  echo "  ⚠️   Fold audit: could not capture before-hierarchy — skipped"
  exit 0
fi

echo "  📜  Fold audit: scrolling to bottom..."
rc=0
with_timeout "$AUDIT_TIMEOUT" \
  maestro "${DEV[@]+"${DEV[@]}"}" test "$FLOWS_DIR/internal/scroll-probe.yaml" \
  >"$TARGET_DIR/fold/scroll-probe.log" 2>&1 || rc=$?
if [[ $rc -ne 0 ]]; then
  echo "  ⚠️   Fold audit: scroll probe failed (rc=$rc) — skipped"
  exit 0
fi

echo "  🔍  Fold audit: capturing after-scroll hierarchy..."
if ! capture "$TARGET_DIR/fold/hierarchy-after.json"; then
  echo "  ⚠️   Fold audit: could not capture after-hierarchy — skipped"
  exit 0
fi

# ──────────── Classify ────────────────────────────────────────────
python3 "$SCRIPT_DIR/fold_audit_cli.py" \
  --before "$TARGET_DIR/fold/hierarchy-before.json" \
  --after  "$TARGET_DIR/fold/hierarchy-after.json" \
  --flow   "$FLOW_NAME" \
  --device "${MAESTRO_DEVICE_UDID:-unknown}" \
  --output "$TARGET_DIR/fold-audit.json" || true

if [[ -f "$TARGET_DIR/fold-audit.json" ]]; then
  python3 - "$TARGET_DIR/fold-audit.json" <<'PYEOF'
import json, sys
d = json.load(open(sys.argv[1]))
v = d.get("verdict"); c = d.get("counts", {})
if v == "NO_CUE":
    names = ", ".join(h["key"] for h in d.get("hidden", [])[:3])
    print(f"  ❌  Fold audit: {c.get('hiddenInteractive',0)} control(s) below the fold with NO scroll cue ({names})")
elif v == "HIDDEN":
    print(f"  ⚠️   Fold audit: {c.get('hidden',0)} element(s) below the fold (scroll cue present)")
elif v == "PROBE_FAILED":
    print(f"  ⚠️   Fold audit: probe failed — {'; '.join(d.get('warnings', []))}")
else:
    print(f"  ✅  Fold audit: no false bottom ({v})")
PYEOF
fi

exit 0
