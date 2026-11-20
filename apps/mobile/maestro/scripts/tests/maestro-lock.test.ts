/**
 * The machine-wide Maestro lock (lib/maestro-lock.sh).
 *
 * Maestro 2.5.1 drives every single-device iOS run through one driver port,
 * 7001, whatever `--device` says, so two runs on two simulators at once drive
 * each other's (2026-11-19: one run's `launchApp` closed the other's app).
 * The lock makes the harness run one Maestro at a time on lane 0 (ADR-156:
 * lanes 1+ reuse it, see lane.test.ts).
 *
 * Each case runs real bash against a private lock directory; the driver
 * cleanup and the process scan are stubbed so nothing on the machine is
 * touched.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

const LIB = resolve(__dirname, '../lib/maestro-lock.sh');

/**
 * Stubs every test shares: no real driver is killed, no real run is seen.
 * stderr joins stdout so the messages keep their order against the echoes.
 */
const STUBS = `
exec 2>&1
source "${LIB}"
maestro_kill_drivers() { echo "drivers-cleared"; }
_maestro_other_runs() { :; }
`;

let dir: string;
let lock: string;

function bash(
  script: string,
  env: Record<string, string> = {},
): {
  status: number | null;
  out: string;
} {
  const r = spawnSync('bash', ['-c', `${STUBS}\n${script}`], {
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '',
      MAESTRO_LOCK_DIR: lock,
      MAESTRO_LOCK_POLL: '0.2',
      MAESTRO_PARALLEL_SAFE: '0',
      ...env,
    },
    timeout: 30_000,
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'maestro-lock-'));
  lock = join(dir, 'xangarro-maestro.lock');
});

describe('maestro_lock_acquire', () => {
  it('takes a free lock, names its holder and gives it back when the script ends', () => {
    const r = bash(`
      MAESTRO_DEVICE_UDID=AAAA-1111 maestro_lock_acquire || exit 9
      echo "pid=$(cat "$MAESTRO_LOCK_DIR/pid") self=$$"
      grep -q "AAAA-1111" "$MAESTRO_LOCK_DIR/info" && echo "info-ok"
    `);
    assert.equal(r.status, 0, r.out);
    const m = /pid=(\d+) self=(\d+)/.exec(r.out);
    assert.ok(m, r.out);
    assert.equal(m[1], m[2]);
    assert.match(r.out, /info-ok/);
    // Cleared once on the way in and once on the way out.
    assert.equal(r.out.match(/drivers-cleared/g)?.length, 2, r.out);
    assert.equal(existsSync(lock), false, 'the lock must be gone after exit');
  });

  it('gives the lock back when the script fails', () => {
    const r = bash(`maestro_lock_acquire || exit 9; false; exit 3`);
    assert.equal(r.status, 3, r.out);
    assert.equal(existsSync(lock), false);
  });

  it('waits for a live holder, names it, and gives up after MAESTRO_LOCK_WAIT', () => {
    const r = bash(
      `
      bash -c 'source "${LIB}"; maestro_kill_drivers() { :; }; _maestro_other_runs() { :; }
               MAESTRO_DEVICE_UDID=HOLDER-UDID maestro_lock_acquire; touch "${dir}/ready"; sleep 6' &
      while [ ! -f "${dir}/ready" ]; do sleep 0.1; done
      maestro_lock_acquire; echo "rc=$?"
      kill %1 2>/dev/null; wait 2>/dev/null
    `,
      { MAESTRO_LOCK_WAIT: '1' },
    );
    assert.match(r.out, /rc=1/, r.out);
    assert.match(r.out, /HOLDER-UDID/, 'the message must say who holds Maestro');
  });

  it('goes on as soon as the holder finishes', () => {
    const r = bash(
      `
      bash -c 'source "${LIB}"; maestro_kill_drivers() { :; }; _maestro_other_runs() { :; }
               maestro_lock_acquire; touch "${dir}/ready"; sleep 1' &
      while [ ! -f "${dir}/ready" ]; do sleep 0.1; done
      maestro_lock_acquire; echo "rc=$?"
      [ "$(cat "$MAESTRO_LOCK_DIR/pid")" = "$$" ] && echo "mine"
    `,
      { MAESTRO_LOCK_WAIT: '20' },
    );
    assert.match(r.out, /rc=0/, r.out);
    assert.match(r.out, /mine/, r.out);
  });

  it('takes over a lock whose holder died without giving it back', () => {
    mkdirSync(lock);
    // A pid no process has: the holder was SIGKILLed.
    writeFileSync(join(lock, 'pid'), '999999\n');
    const r = bash(
      `maestro_lock_acquire; echo "rc=$?"; echo "holder=$(cat "$MAESTRO_LOCK_DIR/pid") self=$$"`,
      { MAESTRO_LOCK_WAIT: '2' },
    );
    assert.match(r.out, /rc=0/, r.out);
    const m = /holder=(\d+) self=(\d+)/.exec(r.out);
    assert.ok(m, r.out);
    assert.equal(m[1], m[2]);
    assert.match(r.out, /left by pid 999999/, 'the takeover must be reported');
  });

  it('survives `set -euo pipefail` callers while a lock is half-made (no pid yet)', () => {
    // fresh-install.sh and maestro-diagnose.sh run strict; a failed read of
    // the holder must not end them.
    mkdirSync(lock);
    const r = bash(`set -euo pipefail; maestro_lock_acquire || echo "busy"; echo "still-running"`, {
      MAESTRO_LOCK_WAIT: '1',
    });
    assert.match(r.out, /busy/, r.out);
    assert.match(r.out, /still-running/, r.out);
  });

  it('gives the lock back on exit under `set -euo pipefail`', () => {
    const r = bash(`set -euo pipefail; maestro_lock_acquire || exit 9; echo "held"`);
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /held/, r.out);
    assert.equal(existsSync(lock), false, r.out);
  });

  it('lets a script started by the holder through, without giving the lock back early', () => {
    const r = bash(
      `
      maestro_lock_acquire || exit 9
      bash -c 'source "${LIB}"; maestro_kill_drivers() { echo child-cleared; }; _maestro_other_runs() { :; }
               maestro_lock_acquire && echo child-in'
      [ -d "$MAESTRO_LOCK_DIR" ] && [ "$(cat "$MAESTRO_LOCK_DIR/pid")" = "$$" ] && echo "still-mine"
    `,
      { MAESTRO_LOCK_WAIT: '1' },
    );
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /child-in/, r.out);
    assert.match(r.out, /still-mine/, r.out);
    // The child neither clears the holder's driver nor releases.
    assert.doesNotMatch(r.out, /child-cleared/, r.out);
  });

  it('waits for a Maestro run started outside the harness before clearing drivers', () => {
    const marker = join(dir, 'other-run');
    writeFileSync(marker, '');
    const r = bash(
      `
      _maestro_other_runs() { [ -f "${marker}" ] && echo "4242 java maestro.cli.AppKt test other.yaml"; }
      ( sleep 1; rm -f "${marker}" ) &
      maestro_lock_acquire; echo "rc=$?"
    `,
      { MAESTRO_LOCK_WAIT: '20' },
    );
    assert.match(r.out, /rc=0/, r.out);
    assert.match(r.out, /other\.yaml/, 'the message must show the run it waits on');
    const cleared = r.out.indexOf('drivers-cleared');
    const waited = r.out.indexOf('other.yaml');
    assert.ok(
      waited >= 0 && cleared > waited,
      `drivers cleared before the other run ended:\n${r.out}`,
    );
  });

  it('refuses when another run outside the harness never ends, and gives the lock back', () => {
    const r = bash(
      `
      _maestro_other_runs() { echo "4242 java maestro.cli.AppKt test stuck.yaml"; }
      maestro_lock_acquire; echo "rc=$?"
      [ -d "$MAESTRO_LOCK_DIR" ] && echo "lock-left-behind"
    `,
      { MAESTRO_LOCK_WAIT: '1' },
    );
    assert.match(r.out, /rc=1/, r.out);
    assert.doesNotMatch(r.out, /lock-left-behind/, r.out);
  });
});
