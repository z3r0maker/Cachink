/**
 * Maestro lanes (lib/lane.sh, ADR-156): each run takes a lane of its own —
 * simulator, contracts mock and Metro — so sessions can run at once with
 * Maestro 2.6+. Lane 0 (the machine-wide lock) stays for older Maestro.
 *
 * Real bash against private lane and lock directories. Devices, services,
 * driver cleanup and the process scan are stubbed: nothing on the machine
 * is booted, started or killed.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

const LANE = resolve(__dirname, '../lib/lane.sh');
const LOCK = resolve(__dirname, '../lib/maestro-lock.sh');

let dir: string;
let lanes: string;
let repo: string;
let bin: string;

/** lane.sh with the device, the services and the machine stubbed out. */
const STUBS = `
exec 2>&1
source "${LANE}"
maestro_kill_drivers() { echo "drivers-cleared:\${MAESTRO_DEVICE_UDID:-}"; }
_maestro_other_runs() { :; }
lane_device_ensure() { export MAESTRO_DEVICE_UDID="UDID-L$1-$2"; }
lane_services_up() { echo "services-up:$1"; }
`;

function bash(script: string, env: Record<string, string> = {}) {
  const r = spawnSync('bash', ['-c', `${STUBS}\n${script}`], {
    encoding: 'utf8',
    env: {
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      LANE_ROOT: lanes,
      LANE_REPO_ROOT: repo,
      MAESTRO_LANES: '3',
      MAESTRO_PARALLEL_SAFE: '1',
      MAESTRO_LOCK_DIR: join(dir, 'lane0.lock'),
      MAESTRO_LOCK_POLL: '0.2',
      ...env,
    },
    timeout: 30_000,
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

/** A lane held by a live process (this test runner), as another session would. */
function holdLane(n: number) {
  const lock = join(lanes, `L${n}`, 'run.lock');
  mkdirSync(lock, { recursive: true });
  writeFileSync(join(lock, 'pid'), `${process.pid}\n`);
  writeFileSync(join(lock, 'info'), `pid ${process.pid} · lane ${n} · other-session`);
}

function warmedBy(n: number, root: string) {
  mkdirSync(join(lanes, `L${n}`), { recursive: true });
  writeFileSync(join(lanes, `L${n}`, 'root'), `${root}\n`);
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'maestro-lane-'));
  lanes = join(dir, 'lanes');
  repo = join(dir, 'worktree');
  bin = join(dir, 'bin');
  mkdirSync(bin);
});

describe('lane_acquire', () => {
  it('takes a free lane and exports its own simulator, mock, Metro and entry state', () => {
    const r = bash(`
      lane_acquire iphone || exit 9
      echo "lane=$MAESTRO_LANE udid=$MAESTRO_DEVICE_UDID"
      echo "mock=$MAESTRO_LANE_MOCK_API metro=$MAESTRO_LANE_METRO_PORT setup=$MOCK_API"
      echo "state=$STATE_FILE"
      grep -q "lane 1 · UDID-L1-iphone" "$MAESTRO_LOCK_DIR/info" && echo "info-ok"
    `);
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /lane=1 udid=UDID-L1-iphone/, r.out);
    assert.match(
      r.out,
      /mock=http:\/\/127\.0\.0\.1:3101 metro=8101 setup=http:\/\/127\.0\.0\.1:3101/,
      r.out,
    );
    assert.match(r.out, new RegExp(`state=${lanes}/L1/state-UDID-L1-iphone`), r.out);
    assert.match(r.out, /info-ok/, r.out);
    assert.match(r.out, /drivers-cleared:UDID-L1-iphone/, 'only its own driver is cleared');
    assert.equal(existsSync(join(lanes, 'L1', 'run.lock')), false, 'freed on exit');
  });

  it('skips a lane another session holds', () => {
    holdLane(1);
    const r = bash(
      `lane_acquire ipad || exit 9; echo "lane=$MAESTRO_LANE port=$MAESTRO_LANE_METRO_PORT"`,
    );
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /lane=2 port=8102/, r.out);
    assert.equal(existsSync(join(lanes, 'L1', 'run.lock', 'pid')), true, "the holder's lock stays");
  });

  it('goes back to the lane its own worktree warmed, before a never-used one', () => {
    warmedBy(3, repo);
    const r = bash(`lane_acquire || exit 9; echo "lane=$MAESTRO_LANE"`);
    assert.match(r.out, /lane=3/, r.out);
  });

  it("takes another worktree's lane only when no unused lane is left", () => {
    warmedBy(1, join(dir, 'someone-else'));
    const first = bash(`lane_acquire || exit 9; echo "lane=$MAESTRO_LANE"`);
    assert.match(first.out, /lane=2/, first.out);
    holdLane(2);
    holdLane(3);
    const last = bash(`lane_acquire || exit 9; echo "lane=$MAESTRO_LANE"`);
    assert.match(last.out, /lane=1/, last.out);
  });

  it('waits while every lane is in use, names the holders, and gives up after MAESTRO_LOCK_WAIT', () => {
    [1, 2, 3].forEach(holdLane);
    const r = bash(`lane_acquire; echo "rc=$?"`, { MAESTRO_LOCK_WAIT: '1' });
    assert.match(r.out, /rc=1/, r.out);
    assert.match(r.out, /All 3 Maestro lanes are in use/, r.out);
    assert.match(r.out, /other-session/, r.out);
  });

  it('gives the lane back when its simulator cannot be set up', () => {
    const r = bash(`
      lane_device_ensure() { echo "no dev client"; return 1; }
      lane_acquire || exit 4
    `);
    assert.equal(r.status, 4, r.out);
    assert.equal(existsSync(join(lanes, 'L1', 'run.lock')), false, r.out);
  });

  it('lets a script started by the lane holder run under the same lane', () => {
    const r = bash(`
      lane_acquire || exit 9
      bash -c 'source "${LOCK}"; maestro_kill_drivers() { :; }; _maestro_other_runs() { :; }
               maestro_lock_acquire && echo "child-in:$MAESTRO_LOCK_DIR"'
    `);
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, new RegExp(`child-in:${lanes}/L1/run.lock`), r.out);
  });
});

describe('lanes_enabled', () => {
  function withMaestro(version: string | null) {
    if (version !== null) {
      writeFileSync(join(bin, 'maestro'), `#!/usr/bin/env bash\necho "${version}"\n`, {
        mode: 0o755,
      });
    }
    return bash(`lanes_enabled && echo "lanes-on" || echo "lane-0"`, {
      MAESTRO_PARALLEL_SAFE: '',
      PATH: `${bin}:/usr/bin:/bin`,
    });
  }

  it('turns lanes on from Maestro 2.6.0', () => {
    assert.match(withMaestro('2.12.1').out, /lanes-on/);
    assert.match(withMaestro('2.6.0').out, /lanes-on/);
  });

  it('keeps Maestro 2.5.1 on lane 0, and says why', () => {
    const r = withMaestro('2.5.1');
    assert.match(r.out, /lane-0/, r.out);
    assert.match(r.out, /older than 2\.6\.0/, r.out);
  });

  it('keeps lane 0 when no maestro is found', () => {
    assert.match(withMaestro(null).out, /lane-0/);
  });

  it('keeps lane 0 when MAESTRO_LANES=0', () => {
    const r = bash(`lanes_enabled && echo "lanes-on" || echo "lane-0"`, { MAESTRO_LANES: '0' });
    assert.match(r.out, /lane-0/, r.out);
  });
});

describe('maestro_kill_drivers and the run scan', () => {
  const UDID = '11111111-2222-3333-4444-555555555555';

  /** pkill and ps stand-ins that log what they were asked. */
  function stubTools() {
    writeFileSync(join(bin, 'pkill'), `#!/usr/bin/env bash\necho "$*" >> "${dir}/pkill.log"\n`, {
      mode: 0o755,
    });
    writeFileSync(join(bin, 'lsof'), '#!/usr/bin/env bash\nexit 1\n', { mode: 0o755 });
    writeFileSync(
      join(bin, 'ps'),
      [
        '#!/usr/bin/env bash',
        `echo "101 java -classpath x maestro.cli.AppKt --device ${UDID} test a.yaml"`,
        'echo "202 java -classpath x maestro.cli.AppKt --device 99999999-0000-0000-0000-000000000000 test b.yaml"',
        '',
      ].join('\n'),
      { mode: 0o755 },
    );
  }

  function kill(env: Record<string, string>) {
    stubTools();
    spawnSync('bash', ['-c', `source "${LOCK}"; maestro_kill_drivers`], {
      env: { PATH: `${bin}:/usr/bin:/bin`, ...env },
    });
    return existsSync(join(dir, 'pkill.log')) ? readFileSync(join(dir, 'pkill.log'), 'utf8') : '';
  }

  it("with Maestro 2.6+ clears only this simulator's driver", () => {
    const log = kill({ MAESTRO_PARALLEL_SAFE: '1', MAESTRO_DEVICE_UDID: UDID });
    const lines = log.trim().split('\n');
    assert.equal(lines.length, 2, log);
    lines.forEach((l) => assert.ok(l.includes(UDID), `unscoped pkill: ${l}`));
  });

  it('with Maestro 2.6+ and no simulator pinned clears nothing', () => {
    assert.equal(kill({ MAESTRO_PARALLEL_SAFE: '1' }), '');
  });

  it('with older Maestro clears every driver, as port 7001 is shared', () => {
    const log = kill({ MAESTRO_PARALLEL_SAFE: '0', MAESTRO_DEVICE_UDID: UDID });
    assert.match(log, /maestro-driver-iosUITests-Runner$/m, log);
    assert.doesNotMatch(log, new RegExp(UDID), log);
  });

  it("with Maestro 2.6+ waits only on runs on this run's simulator", () => {
    stubTools();
    const r = spawnSync('bash', ['-c', `source "${LOCK}"; _maestro_other_runs`], {
      encoding: 'utf8',
      env: { PATH: `${bin}:/usr/bin:/bin`, MAESTRO_PARALLEL_SAFE: '1', MAESTRO_DEVICE_UDID: UDID },
    });
    assert.match(r.stdout, /a\.yaml/, r.stdout);
    assert.doesNotMatch(r.stdout, /b\.yaml/, r.stdout);
  });
});

describe('lane_services_up', () => {
  /** Services stubbed alive or dead; starting one only says so. */
  function up(alive: boolean, env: Record<string, string> = {}) {
    mkdirSync(join(repo, 'node_modules'), { recursive: true });
    mkdirSync(join(repo, 'packages/contracts/src'), { recursive: true });
    return spawnSync(
      'bash',
      [
        '-c',
        `exec 2>&1; source "${LANE}"
         lane_service_alive() { ${alive ? 'return 0' : 'return 1'}; }
         _lane_mock_answers() { return 0; }
         _lane_metro_answers() { return 0; }
         _lane_start_mock() { echo "start-mock:$2"; touch "$1/mock.started"; }
         _lane_start_metro() { echo "start-metro:$2:$3"; }
         mkdir -p "$(lane_dir 2)"; lane_services_up 2; echo "root=$(cat "$(lane_dir 2)/root")"`,
      ],
      {
        encoding: 'utf8',
        env: { PATH: process.env.PATH ?? '', LANE_ROOT: lanes, LANE_REPO_ROOT: repo, ...env },
      },
    ).stdout;
  }

  it("starts lane 2's mock on 3102 and its Metro on 8102 pointed at it, from this worktree", () => {
    warmedBy(2, join(dir, 'someone-else'));
    const out = up(true);
    assert.match(out, /start-mock:3102/, out);
    assert.match(out, /start-metro:8102:3102/, out);
    assert.match(out, new RegExp(`root=${repo}`), out);
  });

  it('keeps warm services its own worktree started', () => {
    warmedBy(2, repo);
    mkdirSync(join(repo, 'packages/contracts/src'), { recursive: true });
    // Started after the last change to the mock's source.
    writeFileSync(join(lanes, 'L2', 'mock.started'), '');
    const out = up(true);
    assert.doesNotMatch(out, /start-/, out);
  });

  it('restarts the mock when the contracts changed since it started', () => {
    warmedBy(2, repo);
    writeFileSync(join(lanes, 'L2', 'mock.started'), '');
    mkdirSync(join(repo, 'packages/contracts/src'), { recursive: true });
    writeFileSync(join(repo, 'packages/contracts/src/wire.ts'), '// changed\n');
    const out = up(true);
    assert.match(out, /start-mock/, out);
    assert.doesNotMatch(out, /start-metro/, 'Metro reloads on its own');
  });

  it('restarts services that died', () => {
    warmedBy(2, repo);
    const out = up(false);
    assert.match(out, /start-mock/, out);
    assert.match(out, /start-metro/, out);
  });

  it('refuses a worktree without node_modules', () => {
    const r = spawnSync(
      'bash',
      ['-c', `exec 2>&1; source "${LANE}"; lane_services_up 1; echo "rc=$?"`],
      {
        encoding: 'utf8',
        env: { PATH: process.env.PATH ?? '', LANE_ROOT: lanes, LANE_REPO_ROOT: repo },
      },
    );
    assert.match(r.stdout, /no node_modules/, r.stdout);
    assert.match(r.stdout, /rc=1/, r.stdout);
  });
});
