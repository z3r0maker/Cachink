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
# reinstalls the driver on the next run, but only if the old one is gone.
#
# Only the driver: with_timeout already killed the maestro it timed out.
# This used to `pkill -9 -f maestro` (and XCTRunner, xctest) machine-wide,
# which also killed other sessions' runs and the Maestro MCP server. The
# caller holds the Maestro lock, so any driver left is this run's.
# shellcheck source=maestro-lock.sh
source "$(dirname "${BASH_SOURCE[0]}")/maestro-lock.sh"
kill_maestro_driver() {
  echo "  🧹  Clearing the Maestro driver..."
  maestro_kill_drivers
}
