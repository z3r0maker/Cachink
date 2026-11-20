#!/usr/bin/env bash
# -------------------------------------------------------------------
# maestro-locked.sh — run one `maestro` command under the harness's lock.
#
# For hand runs and scratch harnesses. A bare `maestro test` takes no lock,
# so two can share a simulator or lane 0's mock and Metro.
#
#   # A lane of its own (ADR-156, Maestro 2.6+): its own simulator, mock and
#   # Metro; other sessions run at the same time. --device is filled in.
#   apps/mobile/maestro/scripts/maestro-locked.sh --lane [se|iphone|ipad] test flow.yaml
#
#   # Lane 0: your simulator, the mock on :3000, Metro on :8081, one at a time.
#   apps/mobile/maestro/scripts/maestro-locked.sh --device <udid> test flow.yaml
#
# The exit code is maestro's.
# -------------------------------------------------------------------
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/lane.sh
source "$SCRIPT_DIR/lib/lane.sh"

if [[ "${1:-}" == --lane ]]; then
  shift
  class=iphone
  case "${1:-}" in se | iphone | ipad) class="$1" && shift ;; esac
  if ! lanes_enabled; then
    echo "❌  --lane needs Maestro 2.6 or later (have ${MAESTRO_CLI_VERSION:-?}); see ADR-156." >&2
    exit 1
  fi
  lane_acquire "$class" || exit 1
  maestro --device "$MAESTRO_DEVICE_UDID" "$@"
  exit $?
fi

# Name the simulator in the lock, so whoever waits knows whose run it is.
args=("$@")
for ((i = 0; i < ${#args[@]}; i++)); do
  case "${args[$i]}" in
    --device | --udid) MAESTRO_DEVICE_UDID="${args[$((i + 1))]:-}" ;;
    --device=* | --udid=*) MAESTRO_DEVICE_UDID="${args[$i]#*=}" ;;
  esac
done

maestro_lock_acquire || exit 1
maestro "$@"
exit $?
