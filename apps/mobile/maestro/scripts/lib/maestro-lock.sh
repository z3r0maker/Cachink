#!/usr/bin/env bash
# -------------------------------------------------------------------
# maestro-lock.sh — one Maestro run at a time per lane.
#
# Lane 0 (this file's default lock, /tmp/xangarro-maestro.lock) is the
# shared mock on :3000 and Metro on :8081, so its runs still go one at a
# time. lane.sh points MAESTRO_LOCK_DIR at a lane's own lock instead, and
# with Maestro 2.6+ (MAESTRO_PARALLEL_SAFE=1) the driver cleanup and the
# run scan below only touch this run's simulator (ADR-157).
#
# Why it began: Maestro 2.5.1 drives every single-device iOS run through ONE driver
# port, 7001 (hard-coded in TestCommand.selectPort; only sharded runs get
# another), and its start-up check reuses whatever driver already listens
# there — whichever simulator that driver belongs to. Two sessions testing
# two simulators at once therefore drive each other's: on 2026-11-19 one
# run's `launchApp` closed the app on another session's simulator
# («Terminating for automation testing»), and that session's setup failed
# on the home screen. A leftover driver does the same to the next run.
#
# So every harness entry point takes this lock before its first Maestro
# command and keeps it to the end:
#
#   source "$SCRIPT_DIR/lib/maestro-lock.sh"
#   maestro_lock_acquire || exit 1
#
# Taking it: waits (MAESTRO_LOCK_WAIT seconds, default an hour) while
# another script holds it, saying who; takes over a lock whose holder is
# gone; then waits out any Maestro run started outside the harness and
# clears leftover drivers, so this run starts its own on 7001.
# Leaving (the EXIT trap): clears this run's driver and frees the lock.
# A script the holder starts (fresh-install.sh from entry-setup.sh) runs
# under the holder's lock — MAESTRO_LOCK_OWNER is exported for that.
#
# Hand runs: scripts/maestro-locked.sh <maestro args>.
# Honors: MAESTRO_LOCK_DIR (default /tmp/xangarro-maestro.lock),
#         MAESTRO_LOCK_WAIT, MAESTRO_LOCK_POLL (seconds),
#         MAESTRO_LOCK_NO_DRIVER_CLEANUP=1, MAESTRO_LOCK_NO_RUN_SCAN=1.
# -------------------------------------------------------------------

MAESTRO_LOCK_DIR="${MAESTRO_LOCK_DIR:-/tmp/xangarro-maestro.lock}"

# a.b.c >= x.y.z
_version_at_least() {
  local IFS=. i
  local -a a b
  read -r -a a <<<"$1"
  read -r -a b <<<"$2"
  for i in 0 1 2; do
    ((10#${a[i]:-0} > 10#${b[i]:-0})) && return 0
    ((10#${a[i]:-0} < 10#${b[i]:-0})) && return 1
  done
  return 0
}

# Maestro 2.6.0 gave each run its own driver port and each device its own
# session (mobile-dev-inc/maestro#3138). Probed once per process tree, and
# never fails: callers run under `set -e`.
maestro_parallel_safe() {
  if [[ -z "${MAESTRO_PARALLEL_SAFE:-}" ]]; then
    local v
    v=$(maestro --version 2>/dev/null | grep -Eo '^[0-9]+\.[0-9]+\.[0-9]+' | tail -1 || true)
    MAESTRO_PARALLEL_SAFE=0
    if [[ -n "$v" ]] && _version_at_least "$v" 2.6.0; then MAESTRO_PARALLEL_SAFE=1; fi
    export MAESTRO_PARALLEL_SAFE MAESTRO_CLI_VERSION="${v:-unknown}"
  fi
  [[ "$MAESTRO_PARALLEL_SAFE" == 1 ]]
}

# Stops this run's Maestro iOS driver: the xcodebuild that hosts it and the
# runner app inside its simulator. Only call it while holding the lock.
#
# Maestro 2.6+ (MAESTRO_PARALLEL_SAFE=1): each run has its own driver port,
# so only MAESTRO_DEVICE_UDID's driver is ours; other lanes' are left alone,
# and with no simulator pinned there is nothing to clear. Older Maestro
# shares 7001: every driver on the machine goes, and the port must free up.
maestro_kill_drivers() {
  [[ "${MAESTRO_LOCK_NO_DRIVER_CLEANUP:-}" == 1 ]] && return 0
  if [[ "${MAESTRO_PARALLEL_SAFE:-}" == 1 ]]; then
    local udid="${MAESTRO_DEVICE_UDID:-}"
    [[ "$udid" =~ ^[0-9A-Fa-f-]{36}$ ]] || return 0
    pkill -f "xcodebuild test-without-building.*id=$udid" 2>/dev/null || true
    pkill -f "Devices/$udid/.*maestro-driver-iosUITests-Runner" 2>/dev/null || true
    return 0
  fi
  pkill -f 'xcodebuild test-without-building.*maestro-driver-ios' 2>/dev/null || true
  pkill -f 'maestro-driver-iosUITests-Runner' 2>/dev/null || true
  local i
  for i in 1 2 3 4 5 6 7 8 9 10; do
    lsof -nP -iTCP:7001 -sTCP:LISTEN >/dev/null 2>&1 || return 0
    sleep 1
  done
  echo "⚠️   Something still listens on 127.0.0.1:7001 after clearing the Maestro drivers." >&2
}

# Maestro runs that are not this harness's (a hand `maestro test`, another
# tool): one `pid command` line each. The `maestro mcp` server is left out —
# it holds no driver until asked.
_maestro_other_runs() {
  [[ "${MAESTRO_LOCK_NO_RUN_SCAN:-}" == 1 ]] && return 0
  local runs
  runs=$(ps -axo pid=,command= 2>/dev/null \
    | grep -E '[m]aestro\.cli\.AppKt.* (test|hierarchy|record)( |$)' \
    | cut -c1-200 || true)
  # Maestro 2.6+: only a run on this run's simulator is in the way.
  if [[ "${MAESTRO_PARALLEL_SAFE:-}" == 1 && -n "${MAESTRO_DEVICE_UDID:-}" ]]; then
    runs=$(grep -F -- "$MAESTRO_DEVICE_UDID" <<<"$runs" || true)
  fi
  [[ -z "$runs" ]] || echo "$runs"
}

# Never fails: callers run under `set -euo pipefail`, and the EXIT trap is
# not shielded from errexit the way `maestro_lock_acquire || exit 1` is.
_maestro_lock_holder() { cat "$MAESTRO_LOCK_DIR/pid" 2>/dev/null || true; }

_maestro_lock_describe() {
  cat "$MAESTRO_LOCK_DIR/info" 2>/dev/null || echo "pid $(_maestro_lock_holder)"
}

_maestro_lock_alive() { [[ -n "$1" ]] && ps -p "$1" >/dev/null 2>&1; }

# One attempt. mkdir is atomic, so of two callers exactly one gets it.
_maestro_lock_try() {
  if mkdir "$MAESTRO_LOCK_DIR" 2>/dev/null; then
    echo "$$" >"$MAESTRO_LOCK_DIR/pid"
    return 0
  fi
  local holder
  holder=$(_maestro_lock_holder)
  if [[ -z "$holder" ]]; then
    # Being created this instant — or its creator died before writing the
    # pid. Only a minute-old empty lock is treated as abandoned.
    if [[ -n "$(find "$MAESTRO_LOCK_DIR" -maxdepth 0 -mmin +1 2>/dev/null)" ]]; then
      rm -rf "$MAESTRO_LOCK_DIR"
    fi
    return 1
  fi
  _maestro_lock_alive "$holder" && return 1
  # The holder is gone without freeing it (SIGKILL, a closed terminal).
  # Remove it only while it still names that holder, then try once more.
  if [[ "$(_maestro_lock_holder)" == "$holder" ]]; then
    rm -rf "$MAESTRO_LOCK_DIR"
    echo "🔓  Freed a Maestro lock left by pid $holder, which is gone." >&2
  fi
  if mkdir "$MAESTRO_LOCK_DIR" 2>/dev/null; then
    echo "$$" >"$MAESTRO_LOCK_DIR/pid"
    return 0
  fi
  return 1
}

# Waits on a condition with the shared budget, saying why once a minute.
# Usage: _maestro_lock_wait <message-fn> <done-fn>
_maestro_lock_wait() {
  local say="$1" done_fn="$2"
  local wait_max="${MAESTRO_LOCK_WAIT:-3600}" poll="${MAESTRO_LOCK_POLL:-5}"
  local start=$SECONDS next_note=0 elapsed
  until "$done_fn"; do
    elapsed=$((SECONDS - start))
    if ((elapsed >= wait_max)); then
      echo "❌  Gave up after ${wait_max}s: $("$say")" >&2
      return 1
    fi
    if ((elapsed >= next_note)); then
      echo "⏳  $("$say") Waiting (${elapsed}s of ${wait_max}s)…" >&2
      next_note=$((elapsed + 60))
    fi
    sleep "$poll"
  done
}

_maestro_lock_busy_note() { echo "Maestro is in use: $(_maestro_lock_describe)."; }
_maestro_lock_others_note() {
  echo "A Maestro run outside the harness is still going: $(_maestro_other_runs | tr '\n' ' ')"
}
_maestro_lock_no_others() { [[ -z "$(_maestro_other_runs)" ]]; }

maestro_lock_acquire() {
  # Started by the holder: its lock covers this script too.
  if [[ -n "${MAESTRO_LOCK_OWNER:-}" && "$(_maestro_lock_holder)" == "$MAESTRO_LOCK_OWNER" ]] \
    && _maestro_lock_alive "$MAESTRO_LOCK_OWNER"; then
    return 0
  fi
  _maestro_lock_wait _maestro_lock_busy_note _maestro_lock_try || return 1
  _maestro_lock_hold
  _maestro_lock_settle
}

# Right after taking the lock: what the holder starts runs under it, and it
# is freed on exit. lane.sh calls the two halves around its device setup.
_maestro_lock_hold() {
  maestro_parallel_safe || true
  export MAESTRO_LOCK_OWNER=$$ MAESTRO_LOCK_DIR
  trap 'maestro_lock_release' EXIT
}

# Once the simulator is known: say who holds the lock, wait out runs started
# outside the harness, clear leftover drivers.
_maestro_lock_settle() {
  echo "pid $$ · ${MAESTRO_LANE:+lane $MAESTRO_LANE · }${MAESTRO_DEVICE_UDID:-booted} · $(basename "$0") · ${PWD##*/} · since $(date '+%H:%M:%S')" \
    >"$MAESTRO_LOCK_DIR/info"
  # Runs outside the harness don't take the lock; wait until they end. If
  # one never does, free the lock untouched — its driver is in use.
  if ! _maestro_lock_wait _maestro_lock_others_note _maestro_lock_no_others; then
    trap - EXIT
    rm -rf "$MAESTRO_LOCK_DIR"
    unset MAESTRO_LOCK_OWNER
    return 1
  fi
  maestro_kill_drivers
}

# The EXIT trap. A no-op unless this very process holds the lock.
maestro_lock_release() {
  [[ "${MAESTRO_LOCK_OWNER:-}" == "$$" && "$(_maestro_lock_holder)" == "$$" ]] || return 0
  maestro_kill_drivers
  rm -rf "$MAESTRO_LOCK_DIR"
}
