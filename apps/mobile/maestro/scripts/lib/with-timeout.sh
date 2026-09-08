#!/usr/bin/env bash
# -------------------------------------------------------------------
# with-timeout.sh — bound a command's runtime.
#
# macOS ships no `timeout(1)` and no `gtimeout` unless coreutils is
# installed, so this rolls its own: run in the background, poll, kill.
#
# Why this exists: a dead XCUITest driver does NOT make `maestro test`
# exit. Maestro throws
#     UnknownFailure(errorResponse=Request for isScreenStatic failed, code: 500)
# and then hangs forever. With no bound on the call, a single driver
# death wedges the entire regression — observed 2026-09-07 stalling
# 31 min on egreso-nomina-field-assertions, and 46 min earlier in
# maestro-diagnose.sh. Both looked like "the suite is slow" rather than
# "one call is stuck", which is what made them expensive to spot.
#
# Provides: with_timeout <seconds> <command...>
#           kill_maestro_driver
#
# Exit codes: the command's own, or 124 when it timed out (matching
# GNU timeout's convention).
# -------------------------------------------------------------------

with_timeout() {
  local secs="$1"; shift
  local pid waited=0

  "$@" &
  pid=$!

  while kill -0 "$pid" 2>/dev/null; do
    if (( waited >= secs )); then
      # TERM first so maestro can flush its debug output, then KILL.
      kill -TERM "$pid" 2>/dev/null || true
      sleep 2
      kill -9 "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      return 124
    fi
    sleep 2
    waited=$((waited + 2))
  done

  wait "$pid"
}

# A hung or crashed XCUITest driver poisons every subsequent flow with
# "Failed to connect to /127.0.0.1:7001 (Connection refused)". Maestro
# reinstalls the driver on the next run, but only if the old processes
# are gone — so clear all three.
kill_maestro_driver() {
  echo "  🧹  Clearing Maestro driver processes..."
  pkill -9 -f "maestro" 2>/dev/null || true
  pkill -9 -f "XCTRunner" 2>/dev/null || true
  pkill -9 -f "xctest" 2>/dev/null || true
  sleep 3
}
