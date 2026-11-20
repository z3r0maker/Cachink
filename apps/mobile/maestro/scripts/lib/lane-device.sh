#!/usr/bin/env bash
# -------------------------------------------------------------------
# lane-device.sh — one simulator per lane and device class (ADR-156).
#
# «Xangarro L<N> iphone|se|ipad», on MAESTRO_IOS_RUNTIME (26.5: the dev
# client crashes at launch on 27.0). Created the first time a lane needs it,
# booted, and given the dev client copied from a simulator that already has
# it (or XANGARRO_DEV_CLIENT_APP, a built .app). One dev-client build serves
# every lane: the JS and the API base come from the lane's Metro.
#
# Provides: lane_device_name <n> <class>, lane_device_ensure <n> <class>.
# Honors: LANE_DEVICETYPE_IPHONE / _SE / _IPAD, XANGARRO_DEV_CLIENT_APP.
# -------------------------------------------------------------------

# shellcheck source=device-resolve.sh
source "$(dirname "${BASH_SOURCE[0]}")/device-resolve.sh"

lane_device_name() { printf 'Xangarro L%s %s' "$1" "$2"; }

_lane_devicetype() {
  local p=com.apple.CoreSimulator.SimDeviceType
  case "$1" in
    iphone) echo "${LANE_DEVICETYPE_IPHONE:-$p.iPhone-17-Pro}" ;;
    se) echo "${LANE_DEVICETYPE_SE:-$p.iPhone-SE-3rd-generation}" ;;
    ipad) echo "${LANE_DEVICETYPE_IPAD:-$p.iPad-Pro-11-inch-M5-12GB}" ;;
    *)
      echo "❌  Unknown device class '$1' (expected: se | iphone | ipad)." >&2
      return 1
      ;;
  esac
}

_lane_has_app() {
  xcrun simctl get_app_container "$1" "${APP_ID:-mx.xangarro.mobile}" app >/dev/null 2>&1
}

# A dev client to copy: XANGARRO_DEV_CLIENT_APP, else the newest one
# installed on a booted simulator (other simulators may hold older builds,
# without the latest native modules).
_lane_dev_client_source() {
  if [[ -n "${XANGARRO_DEV_CLIENT_APP:-}" ]]; then
    echo "$XANGARRO_DEV_CLIENT_APP"
    return 0
  fi
  local u app at best="" best_at=0
  for u in $(xcrun simctl list devices booted | grep -Eo '[0-9A-F]{8}-([0-9A-F]{4}-){3}[0-9A-F]{12}'); do
    app=$(xcrun simctl get_app_container "$u" "${APP_ID:-mx.xangarro.mobile}" app 2>/dev/null) || continue
    at=$(stat -f %m "$app/Info.plist" 2>/dev/null || echo 0)
    ((at > best_at)) && best="$app" best_at="$at"
  done
  [[ -n "$best" ]] && echo "$best"
}

_lane_install_dev_client() {
  local udid="$1" src
  if ! src=$(_lane_dev_client_source); then
    echo "❌  No dev client to install on lane device $udid: boot a simulator that has it," >&2
    echo "    or set XANGARRO_DEV_CLIENT_APP to a built .app (npx expo run:ios)." >&2
    return 1
  fi
  echo "📲  Installing the dev client on $udid from $src"
  xcrun simctl install "$udid" "$src"
}

# Exports MAESTRO_DEVICE_UDID: the lane's simulator for the class, booted,
# with the dev client.
lane_device_ensure() {
  local n="$1" class="$2" name type runtime udid
  name="$(lane_device_name "$n" "$class")"
  type="$(_lane_devicetype "$class")" || return 1
  udid="$(udid_for_name "$name")"
  if [[ -z "$udid" ]]; then
    runtime="$(newest_ios_runtime)"
    echo "🔧  Creating lane simulator '$name' ($type on $runtime)"
    udid=$(xcrun simctl create "$name" "$type" "$runtime") || return 1
  fi
  export MAESTRO_DEVICE_UDID="$udid"
  boot_device "$udid"
  _lane_has_app "$udid" || _lane_install_dev_client "$udid"
}
