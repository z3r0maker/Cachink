#!/usr/bin/env bash
# -------------------------------------------------------------------
# lane.sh — see and stop the Maestro lanes (ADR-157, lib/lane.sh).
#
#   apps/mobile/maestro/scripts/lane.sh status       # who holds each lane, its
#                                                    # worktree, ports, services
#   apps/mobile/maestro/scripts/lane.sh down <N|all> [--shutdown]
#       stops a free lane's mock and Metro (and shuts its simulators down);
#       a lane in use is left alone.
#
# Runs take lanes themselves: run-flow.sh, full-regression.sh and
# `maestro-locked.sh --lane`.
# -------------------------------------------------------------------
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/lane.sh
source "$SCRIPT_DIR/lib/lane.sh"

_up() { lane_service_alive "$1" && echo up || echo down; }

status() {
  local n dir holder
  echo "Maestro ${MAESTRO_CLI_VERSION:-$(maestro_parallel_safe; echo "$MAESTRO_CLI_VERSION")} · lane 0: $(cat /tmp/xangarro-maestro.lock/info 2>/dev/null || echo free)"
  for ((n = 1; n <= $(_lane_count); n++)); do
    dir="$(lane_dir "$n")"
    holder=$(cat "$dir/run.lock/info" 2>/dev/null || echo free)
    printf 'L%s  %s\n    worktree %s · mock :%s %s · Metro :%s %s\n' "$n" "$holder" \
      "$(cat "$dir/root" 2>/dev/null || echo —)" \
      "$(lane_mock_port "$n")" "$(_up "$dir/mock.pid")" \
      "$(lane_metro_port "$n")" "$(_up "$dir/metro.pid")"
  done
}

down() {
  local which="${1:-}" shutdown="${2:-}" n class udid
  [[ -n "$which" ]] || { echo "Usage: lane.sh down <N|all> [--shutdown]" >&2; exit 1; }
  for ((n = 1; n <= $(_lane_count); n++)); do
    [[ "$which" == all || "$which" == "$n" ]] || continue
    MAESTRO_LOCK_DIR="$(lane_dir "$n")/run.lock"
    mkdir -p "$(lane_dir "$n")"
    if ! _maestro_lock_try; then
      echo "L$n is in use: $(cat "$MAESTRO_LOCK_DIR/info" 2>/dev/null) — left alone."
      continue
    fi
    lane_services_down "$n"
    if [[ "$shutdown" == --shutdown ]]; then
      for class in iphone se ipad; do
        udid="$(udid_for_name "$(lane_device_name "$n" "$class")")"
        [[ -n "$udid" ]] && xcrun simctl shutdown "$udid" 2>/dev/null
      done
    fi
    rm -rf "$MAESTRO_LOCK_DIR"
    echo "L$n stopped."
  done
}

case "${1:-status}" in
  status) status ;;
  down) down "${2:-}" "${3:-}" ;;
  *) echo "Usage: lane.sh status | down <N|all> [--shutdown]" >&2; exit 1 ;;
esac
