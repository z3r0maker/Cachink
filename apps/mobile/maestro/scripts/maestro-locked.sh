#!/usr/bin/env bash
# -------------------------------------------------------------------
# maestro-locked.sh — run one `maestro` command under the machine-wide lock.
#
# For hand runs and scratch harnesses: a bare `maestro test --device X`
# shares driver port 7001 with every other run on this machine and can end
# up driving another session's simulator (see lib/maestro-lock.sh). This
# waits its turn, clears leftover drivers, runs maestro, and clears its own.
#
#   apps/mobile/maestro/scripts/maestro-locked.sh --device <udid> test flow.yaml
#
# The exit code is maestro's.
# -------------------------------------------------------------------
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/maestro-lock.sh
source "$SCRIPT_DIR/lib/maestro-lock.sh"

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
