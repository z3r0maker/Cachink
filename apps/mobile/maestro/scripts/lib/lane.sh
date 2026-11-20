#!/usr/bin/env bash
# -------------------------------------------------------------------
# lane.sh — parallel Maestro runs, one lane each (ADR-157).
#
# A lane is everything one run must not share: its own simulator per device
# class («Xangarro L<N> iphone|se|ipad»), its own contracts mock (an
# in-memory company: codes, devices, scenario, /__mock/down) on 3100+N, and
# its own Metro on 8100+N, built from the worktree that took the lane and
# pointed at that lane's mock. Lane N's lock (<LANE_ROOT>/L<N>/run.lock) is
# a maestro-lock.sh lock, so a crashed holder is taken over the same way.
#
# Lane 0 is what there was before: any simulator, the mock on :3000, Metro on
# :8081, one run at a time on /tmp/xangarro-maestro.lock. Scripts that don't
# ask for a lane (run-ipad, fold-*, maestro-locked.sh without --lane) and any
# Maestro older than 2.6.0 stay on lane 0 — 2.5.1 hard-codes driver port
# 7001 and shares one session per platform, so it cannot run two at once.
#
#   source lib/device-resolve.sh; source lib/lane.sh
#   lanes_enabled && lane_acquire iphone      # exports MAESTRO_DEVICE_UDID,
#                                             # MAESTRO_LANE_*, MOCK_API, STATE_FILE
#
# Flows read MAESTRO_LANE_MOCK_API and MAESTRO_LANE_METRO_PORT (Maestro hands
# every MAESTRO_* shell variable to a flow) and fall back to lane 0's ports.
# Honors: MAESTRO_LANES (how many, default 4; 0 = lanes off), LANE_ROOT
#         (default /tmp/xangarro-lanes), LANE_MOCK_BASE (3100),
#         LANE_METRO_BASE (8100), MAESTRO_PARALLEL_SAFE (skip the version probe).
# -------------------------------------------------------------------

_LANE_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LANE_ROOT="${LANE_ROOT:-/tmp/xangarro-lanes}"
LANE_REPO_ROOT="${LANE_REPO_ROOT:-$(cd "$_LANE_LIB_DIR/../../../../.." && pwd)}"

# shellcheck source=maestro-lock.sh
source "$_LANE_LIB_DIR/maestro-lock.sh"
# shellcheck source=lane-device.sh
source "$_LANE_LIB_DIR/lane-device.sh"
# shellcheck source=lane-services.sh
source "$_LANE_LIB_DIR/lane-services.sh"

lane_dir() { printf '%s/L%s' "$LANE_ROOT" "$1"; }
lane_mock_port() { echo $(("${LANE_MOCK_BASE:-3100}" + $1)); }
lane_metro_port() { echo $(("${LANE_METRO_BASE:-8100}" + $1)); }
_lane_count() { echo "${MAESTRO_LANES:-4}"; }

lanes_enabled() {
  [[ "$(_lane_count)" != 0 ]] || return 1
  if ! maestro_parallel_safe; then
    echo "ℹ️   Maestro ${MAESTRO_CLI_VERSION:-?} is older than 2.6.0: lane 0, one run at a time (ADR-157)." >&2
    return 1
  fi
}

# Lanes in the order to try them: the ones this worktree already warmed
# (its Metro and mock are up), then never-used ones, then the rest — taking
# one of those restarts its services from this worktree.
_lane_candidates() {
  local n root mine=() unused=() others=()
  for ((n = 1; n <= $(_lane_count); n++)); do
    root=$(cat "$(lane_dir "$n")/root" 2>/dev/null || true)
    if [[ "$root" == "$LANE_REPO_ROOT" ]]; then
      mine+=("$n")
    elif [[ -z "$root" ]]; then
      unused+=("$n")
    else
      others+=("$n")
    fi
  done
  echo "${mine[@]+"${mine[@]}"} ${unused[@]+"${unused[@]}"} ${others[@]+"${others[@]}"}"
}

# One pass over the lanes; takes the first free one. mkdir is atomic, so two
# sessions racing for one lane cannot both get it.
_lane_try_any() {
  local n
  for n in $(_lane_candidates); do
    mkdir -p "$(lane_dir "$n")"
    MAESTRO_LOCK_DIR="$(lane_dir "$n")/run.lock"
    if _maestro_lock_try; then
      MAESTRO_LANE="$n"
      export MAESTRO_LANE MAESTRO_LOCK_DIR
      return 0
    fi
  done
  return 1
}

_lane_busy_note() {
  local n out=""
  for ((n = 1; n <= $(_lane_count); n++)); do
    out+=" L$n: $(cat "$(lane_dir "$n")/run.lock/info" 2>/dev/null || echo '?');"
  done
  echo "All $(_lane_count) Maestro lanes are in use:$out"
}

_lane_export_env() {
  local n="$MAESTRO_LANE"
  export MAESTRO_LANE_MOCK_API="http://127.0.0.1:$(lane_mock_port "$n")"
  export MAESTRO_LANE_METRO_PORT="$(lane_metro_port "$n")"
  export MOCK_API="$MAESTRO_LANE_MOCK_API"
  export STATE_FILE="$(lane_dir "$n")/state-$MAESTRO_DEVICE_UDID"
}

# Usage: lane_acquire [se|iphone|ipad]. Held to the end of the script.
lane_acquire() {
  local class="${1:-iphone}"
  mkdir -p "$LANE_ROOT"
  _maestro_lock_wait _lane_busy_note _lane_try_any || return 1
  _maestro_lock_hold
  lane_device_ensure "$MAESTRO_LANE" "$class" || return 1
  lane_services_up "$MAESTRO_LANE" || return 1
  _lane_export_env
  _maestro_lock_settle || return 1
  echo "🛣️   Lane $MAESTRO_LANE · $(lane_device_name "$MAESTRO_LANE" "$class") ($MAESTRO_DEVICE_UDID)" \
    "· mock :$(lane_mock_port "$MAESTRO_LANE") · Metro :$MAESTRO_LANE_METRO_PORT"
}
