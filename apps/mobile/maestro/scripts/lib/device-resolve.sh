#!/usr/bin/env bash
# -------------------------------------------------------------------
# device-resolve.sh — shared simulator resolution + boot.
#
# Sourced by run-flow.sh, full-regression.sh and run-ipad.sh so the three
# runners share ONE implementation of "turn --device-class into a booted
# simulator UDID". Previously this block was copy-pasted three times, and
# two of the copies exported the python env var AFTER the heredoc that
# consumes it — so the first resolution attempt always returned empty.
#
# Provides: device_pattern <class>, resolve_device <class>,
#           ensure_device <class>, boot_device <udid>, device_state <udid>.
# Honors (with defaults): MAESTRO_SE_DEVICE, MAESTRO_IPHONE_DEVICE,
#                         MAESTRO_IPAD_DEVICE, MAESTRO_IOS_RUNTIME.
#
# Sets MAESTRO_DEVICE_UDID on success (exported for maestro + fresh-install).
# -------------------------------------------------------------------

# Device-class → simulator name. Overridable so a machine with a different
# simulator set does not need this file edited.
#
# NOTE: these defaults track what `xcrun simctl list devices available`
# actually offers. The previous defaults ("iPhone 16", "iPad (10th
# generation)") do not exist under the iOS 26.x runtimes and made
# --device-class fail outright.
MAESTRO_SE_DEVICE="${MAESTRO_SE_DEVICE:-Cachink-SE}"
MAESTRO_IPHONE_DEVICE="${MAESTRO_IPHONE_DEVICE:-iPhone 17}"
MAESTRO_IPAD_DEVICE="${MAESTRO_IPAD_DEVICE:-iPad (A16)}"

# Runtime + devicetype used when creating the small-screen target on demand.
MAESTRO_IOS_RUNTIME="${MAESTRO_IOS_RUNTIME:-}"
_SE_DEVICETYPE="com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation"

# ──────────── Class → name ────────────────────────────────────────
# se     — iPhone SE (3rd gen), 667pt. The smallest modern target and where
#          below-the-fold content is most likely to hide.
# iphone — current-generation phone.
# ipad   — baseline tablet.
device_pattern() {
  local class="$1"
  case "$class" in
    se)     printf '%s' "$MAESTRO_SE_DEVICE" ;;
    iphone) printf '%s' "$MAESTRO_IPHONE_DEVICE" ;;
    ipad)   printf '%s' "$MAESTRO_IPAD_DEVICE" ;;
    *)
      echo "❌  Unknown device class '$class' (expected: se | iphone | ipad)." >&2
      return 1
      ;;
  esac
}

# ──────────── Name → UDID ─────────────────────────────────────────
# Case-insensitive match against available simulators, preferring an EXACT
# name match before falling back to substring.
#
# The exact-match pass matters: the old substring-only lookup resolved
# "iPhone 17" to "iPhone 17 Pro", because Pro / Pro Max / 17e all contain
# it. That silently audited the wrong device — the opposite of the point
# when the whole exercise is comparing form factors.
udid_for_name() {
  export _RESOLVE_TARGET="$1"
  xcrun simctl list devices available -j 2>/dev/null \
    | python3 -c "
import sys, json, os
target = os.environ.get('_RESOLVE_TARGET', '').strip().lower()
# An empty target must match NOTHING. Without this guard the substring test
# below is true for every device, so an unset variable silently resolves to
# whichever simulator happens to be first in simctl JSON -- which is exactly
# how run-ipad.sh had been running its iPad suite on an arbitrary device.
if not target:
    sys.exit(1)
data = json.load(sys.stdin)
names = [d for _, devs in data.get('devices', {}).items() for d in devs]
for d in names:
    if d.get('name', '').lower() == target:
        print(d['udid'])
        sys.exit(0)
for d in names:
    if target in d.get('name', '').lower():
        print(d['udid'])
        sys.exit(0)
" 2>/dev/null || true
}

# ──────────── Current runtime identifier ──────────────────────────
# Newest available iOS runtime, e.g. com.apple.CoreSimulator.SimRuntime.iOS-26-5
newest_ios_runtime() {
  if [[ -n "$MAESTRO_IOS_RUNTIME" ]]; then
    printf '%s' "$MAESTRO_IOS_RUNTIME"
    return 0
  fi
  xcrun simctl list runtimes -j 2>/dev/null \
    | python3 -c "
import sys, json
data = json.load(sys.stdin)
ios = [r for r in data.get('runtimes', []) if r.get('isAvailable') and 'iOS' in r.get('name', '')]
if not ios:
    sys.exit(1)
ios.sort(key=lambda r: [int(p) for p in r.get('version', '0').split('.') if p.isdigit()])
print(ios[-1]['identifier'])
" 2>/dev/null || true
}

# ──────────── Device state ────────────────────────────────────────
device_state() {
  export _STATE_UDID="$1"
  xcrun simctl list devices -j 2>/dev/null \
    | python3 -c "
import sys, json, os
data = json.load(sys.stdin)
udid = os.environ.get('_STATE_UDID', '')
for _, devs in data.get('devices', {}).items():
    for d in devs:
        if d.get('udid') == udid:
            print(d.get('state', 'Unknown'))
            sys.exit(0)
print('Unknown')
" 2>/dev/null || echo "Unknown"
}

# ──────────── Create the SE target on demand ──────────────────────
# The small-screen device is the whole point of the audit matrix, but no
# iPhone SE instance ships by default. Create one the first time it is
# asked for; subsequent runs reuse it.
create_se_device() {
  local name="$1" runtime
  runtime="$(newest_ios_runtime)"
  if [[ -z "$runtime" ]]; then
    echo "❌  No available iOS runtime to create '$name' with." >&2
    return 1
  fi
  echo "🔧  Creating simulator '$name' ($_SE_DEVICETYPE on $runtime)..."
  xcrun simctl create "$name" "$_SE_DEVICETYPE" "$runtime" >/dev/null
}

# ──────────── Resolve (create if needed) ──────────────────────────
# Usage: ensure_device se|iphone|ipad
# Exports MAESTRO_DEVICE_UDID. Fails loudly, listing what IS available,
# instead of the old silent-empty behaviour.
ensure_device() {
  local class="$1" pattern udid
  pattern="$(device_pattern "$class")" || return 1

  udid="$(udid_for_name "$pattern")"

  # The SE target is ours to create; the others must already exist.
  if [[ -z "$udid" && "$class" == "se" ]]; then
    create_se_device "$pattern" || return 1
    udid="$(udid_for_name "$pattern")"
  fi

  if [[ -z "$udid" ]]; then
    echo "❌  Could not find a simulator matching '$pattern' (class: $class)." >&2
    echo "    Override with MAESTRO_SE_DEVICE / MAESTRO_IPHONE_DEVICE / MAESTRO_IPAD_DEVICE." >&2
    echo "    Available:" >&2
    xcrun simctl list devices available 2>/dev/null | sed -n '/-- iOS/,/^--/p' | sed 's/^/      /' >&2
    return 1
  fi

  export MAESTRO_DEVICE_UDID="$udid"
  echo "🎯  Device class: $class → $pattern ($udid)"
}

# ──────────── Boot ────────────────────────────────────────────────
boot_device() {
  local udid="$1" state
  state="$(device_state "$udid")"
  if [[ "$state" != "Booted" ]]; then
    echo "🔄  Booting $udid..."
    xcrun simctl boot "$udid" 2>/dev/null || true
    xcrun simctl bootstatus "$udid" -b 2>/dev/null || sleep 8
  fi
}

# ──────────── Convenience: resolve + boot ─────────────────────────
resolve_device() {
  ensure_device "$1" || return 1
  boot_device "$MAESTRO_DEVICE_UDID"
}

# ──────────── Guard: ambiguous device is CATASTROPHIC ─────────────
# When more than one simulator is booted and no device is pinned, maestro
# does not fail — it PROMPTS:
#
#   [1] iPhone 17 - iOS 26.5 - ...
#   [2] Cachink-SE - iOS 26.5 - ...
#   Multiple running devices detected. Choose a device to run on.
#   Enter a number from the list above:
#
# Run headless with stdout redirected to a file, it reads EOF from stdin,
# re-prompts, and loops forever — writing ~20 MB/s. On 2026-09-07 this
# produced a 62 GB "hierarchy.json" of pure prompt spew in ~50 minutes,
# then a downstream json.load() of it exhausted 52 GB of swap and left the
# machine thrashing. It presents as a hang, which is why it went unnoticed.
#
# Every maestro invocation must therefore pass --device. This guard is the
# backstop for any that slips through.
assert_device_unambiguous() {
  [[ -n "${MAESTRO_DEVICE_UDID:-}" ]] && return 0
  local booted
  booted=$(xcrun simctl list devices booted 2>/dev/null | grep -c "Booted" || echo 0)
  if (( booted > 1 )); then
    echo "❌  $booted simulators are booted and MAESTRO_DEVICE_UDID is unset." >&2
    echo "    maestro would prompt for a device and, headless, spin forever" >&2
    echo "    writing prompt text to disk (62 GB incident, 2026-09-07)." >&2
    echo "    Fix: pass --device-class se|iphone|ipad, or shut down the extras:" >&2
    xcrun simctl list devices booted 2>/dev/null | grep "Booted" | sed 's/^/      /' >&2
    return 1
  fi
  return 0
}
