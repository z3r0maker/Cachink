#!/usr/bin/env bash
# -------------------------------------------------------------------
# lane-services.sh — a lane's contracts mock and Metro (ADR-156).
#
# Both are started from the worktree that takes the lane and stay up after
# the run, so that worktree's next run starts warm. They are restarted when
# another worktree takes the lane, when one has died, and (the mock) when
# packages/contracts/src changed since it started. A restarted mock has
# forgotten every device, so the lane's cached entry states are dropped.
#
# Each runs in its own session (setsid), so stopping it stops its children
# too. Logs and pids live in <LANE_ROOT>/L<N>/; Metro keeps its cache in
# the lane's own TMPDIR, so two lanes' bundles (each inlining its own
# EXPO_PUBLIC_API_BASE) never share a transform cache.
#
# Provides: lane_services_up <n>, lane_services_down <n>, lane_service_alive.
# Needs lane.sh's lane_dir / lane_mock_port / lane_metro_port, LANE_REPO_ROOT.
# -------------------------------------------------------------------

_lane_listener() { lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -1 || true; }

lane_service_alive() {
  local pid
  pid=$(cat "$1" 2>/dev/null || true)
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

# Usage: _lane_spawn <pidfile> <log> <cwd> <cmd...>
_lane_spawn() {
  local pidfile="$1" log="$2" cwd="$3"
  shift 3
  (cd "$cwd" && exec perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV or die "exec: $!\n"' "$@") \
    </dev/null >"$log" 2>&1 &
  echo "$!" >"$pidfile"
}

_lane_stop() {
  local pidfile="$1" pid i
  pid=$(cat "$pidfile" 2>/dev/null || true)
  rm -f "$pidfile"
  [[ -n "$pid" ]] || return 0
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  for i in 1 2 3 4 5 6 7 8 9 10; do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 1
  done
  kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
}

# The port must be free, or ours already.
_lane_port_free() {
  local port="$1" who
  who=$(_lane_listener "$port")
  [[ -z "$who" ]] && return 0
  echo "❌  Port $port is taken by pid $who ($(ps -p "$who" -o command= | cut -c1-80))." >&2
  return 1
}

# Usage: _lane_wait <seconds> <cmd...> — true once cmd succeeds.
_lane_wait() {
  local max="$1" start=$SECONDS
  shift
  until "$@" >/dev/null 2>&1; do
    ((SECONDS - start >= max)) && return 1
    sleep 1
  done
}

_lane_mock_answers() { curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$1/"; }
_lane_metro_answers() { curl -s --max-time 2 "http://127.0.0.1:$1/status" | grep -q running; }

_lane_mock_stale() {
  local dir="$1" port="$2"
  lane_service_alive "$dir/mock.pid" && _lane_mock_answers "$port" || return 0
  [[ -n "$(find "$LANE_REPO_ROOT/packages/contracts/src" -newer "$dir/mock.started" -print -quit 2>/dev/null)" ]]
}

_lane_start_mock() {
  local dir="$1" port="$2"
  _lane_stop "$dir/mock.pid"
  _lane_port_free "$port" || return 1
  echo "🧪  Lane mock on :$port"
  _lane_spawn "$dir/mock.pid" "$dir/mock.log" "$LANE_REPO_ROOT/packages/contracts" \
    env PORT="$port" node --import tsx src/mock/cli.ts
  if ! _lane_wait 60 _lane_mock_answers "$port"; then
    echo "❌  The lane mock did not answer on :$port — $dir/mock.log" >&2
    return 1
  fi
  touch "$dir/mock.started"
  rm -f "$dir"/state-*
}

# Asks Metro for the iOS bundle once, so the first launch doesn't wait on a
# cold build past prime-dev-client's timeouts. Best effort.
_lane_warm_bundle() {
  local port="$1" url
  url=$(curl -s --max-time 30 -H 'expo-platform: ios' -H 'accept: application/expo+json' \
    "http://127.0.0.1:$port/" | python3 -c \
    'import sys, json; print(json.load(sys.stdin)["launchAsset"]["url"])' 2>/dev/null || true)
  [[ -n "$url" ]] || return 0
  echo "🔥  Warming the lane bundle (first build takes a minute or two)"
  curl -s -o /dev/null --max-time 400 "$url" || true
}

_lane_start_metro() {
  local dir="$1" port="$2" mock="$3"
  _lane_stop "$dir/metro.pid"
  _lane_port_free "$port" || return 1
  echo "📦  Lane Metro on :$port → mock :$mock"
  mkdir -p "$dir/tmp"
  _lane_spawn "$dir/metro.pid" "$dir/metro.log" "$LANE_REPO_ROOT/apps/mobile" \
    env EXPO_PUBLIC_E2E=1 EXPO_PUBLIC_API_BASE="http://127.0.0.1:$mock" TMPDIR="$dir/tmp" \
    EXPO_NO_TELEMETRY=1 ./node_modules/.bin/expo start --dev-client --localhost --port "$port"
  if ! _lane_wait 180 _lane_metro_answers "$port"; then
    echo "❌  The lane Metro did not come up on :$port — $dir/metro.log" >&2
    return 1
  fi
  _lane_warm_bundle "$port"
}

lane_services_up() {
  local n="$1" dir mock metro other
  dir="$(lane_dir "$n")"
  mock="$(lane_mock_port "$n")"
  metro="$(lane_metro_port "$n")"
  other=0
  [[ "$(cat "$dir/root" 2>/dev/null || true)" == "$LANE_REPO_ROOT" ]] || other=1
  if [[ ! -d "$LANE_REPO_ROOT/apps/mobile/node_modules" ]]; then
    echo "❌  $LANE_REPO_ROOT has no node_modules: run pnpm install first." >&2
    return 1
  fi
  if ((other)) || _lane_mock_stale "$dir" "$mock"; then
    _lane_start_mock "$dir" "$mock" || return 1
  fi
  if ((other)) || ! { lane_service_alive "$dir/metro.pid" && _lane_metro_answers "$metro"; }; then
    _lane_start_metro "$dir" "$metro" "$mock" || return 1
  fi
  echo "$LANE_REPO_ROOT" >"$dir/root"
}

lane_services_down() {
  local dir
  dir="$(lane_dir "$1")"
  _lane_stop "$dir/metro.pid"
  _lane_stop "$dir/mock.pid"
  rm -f "$dir/root" "$dir"/state-*
}
