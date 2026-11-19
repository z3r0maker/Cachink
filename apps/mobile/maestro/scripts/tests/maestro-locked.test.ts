/**
 * maestro-locked.sh — a hand `maestro` command under the machine-wide lock
 * (lib/maestro-lock.sh). A stand-in `maestro` on PATH reports what it saw,
 * so no simulator or driver is involved.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

const WRAPPER = resolve(__dirname, '../maestro-locked.sh');

let lock: string;
let bin: string;

/** Runs the wrapper with the stand-in maestro first on PATH. */
function run(args: string[]): { status: number | null; out: string } {
  const r = spawnSync('bash', [WRAPPER, ...args], {
    encoding: 'utf8',
    env: {
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      MAESTRO_LOCK_DIR: lock,
      MAESTRO_LOCK_NO_DRIVER_CLEANUP: '1',
      MAESTRO_LOCK_NO_RUN_SCAN: '1',
    },
    timeout: 30_000,
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), 'maestro-locked-'));
  lock = join(dir, 'xangarro-maestro.lock');
  bin = join(dir, 'bin');
  mkdirSync(bin);
  // Proves the lock is held while maestro runs, and shows what it names.
  writeFileSync(
    join(bin, 'maestro'),
    [
      '#!/usr/bin/env bash',
      '[ -d "$MAESTRO_LOCK_DIR" ] && echo "held-during:$*"',
      'echo "info:$(cat "$MAESTRO_LOCK_DIR/info")"',
      'exit 7',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
});

describe('maestro-locked.sh', () => {
  it('runs maestro under the lock, frees it, and passes the exit code through', () => {
    const r = run(['test', 'flow.yaml']);
    assert.equal(r.status, 7, r.out);
    assert.match(r.out, /held-during:test flow\.yaml/, r.out);
    assert.equal(existsSync(lock), false, 'the lock must be freed');
  });

  it('names the simulator from --device in the lock, so a waiting run knows whose it is', () => {
    const r = run(['--device', 'ABCD-1234', 'test', 'flow.yaml']);
    assert.match(r.out, /info:pid \d+ · ABCD-1234 · maestro-locked\.sh/, r.out);
  });

  it('reads the --device=<udid> spelling too', () => {
    const r = run(['--device=EFGH-5678', 'test', 'flow.yaml']);
    assert.match(r.out, /EFGH-5678/, r.out);
  });

  it('does not run maestro when the lock stays taken', () => {
    mkdirSync(lock);
    // A live holder: this test's own runner process.
    writeFileSync(join(lock, 'pid'), `${process.pid}\n`);
    const r = spawnSync('bash', [WRAPPER, 'test', 'flow.yaml'], {
      encoding: 'utf8',
      env: {
        PATH: `${bin}:${process.env.PATH ?? ''}`,
        MAESTRO_LOCK_DIR: lock,
        MAESTRO_LOCK_WAIT: '1',
        MAESTRO_LOCK_POLL: '0.2',
        MAESTRO_LOCK_NO_DRIVER_CLEANUP: '1',
        MAESTRO_LOCK_NO_RUN_SCAN: '1',
      },
      timeout: 30_000,
    });
    assert.equal(r.status, 1, `${r.stdout}${r.stderr}`);
    assert.doesNotMatch(r.stdout, /held-during/);
    assert.equal(existsSync(join(lock, 'pid')), true, "the holder's lock must stay");
  });
});
