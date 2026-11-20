import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { assertDiskFree, MIN_FREE_BYTES, parseDfAvailableBytes } from '../src/stack/disk';
import { StackError } from '../src/stack/errors';
import { assertLocalUrl } from '../src/stack/hosts';
import { stackNames } from '../src/stack/names';
import { Teardown } from '../src/stack/teardown';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof StackError ? e.code : `not a StackError: ${String(e)}`;
  }
  return undefined;
};

describe('stackNames', () => {
  it('gives a corrida its own container, build, outbox and lock, all keyed by its id', () => {
    const n = stackNames('20261119-2300-ab12', '/repo');
    assert.equal(n.pgName, 'xangarro-pg-synth-20261119-2300-ab12');
    assert.equal(n.distDir, '.next-synth/20261119-2300-ab12');
    assert.equal(n.outboxDir, '/repo/tools/synth/reports/20261119-2300-ab12/outbox');
    assert.equal(n.lockFile, '/repo/tools/synth/reports/.stacks/20261119-2300-ab12.json');
  });

  it('never names the shared container or another corrida’s', () => {
    const a = stackNames('a1', '/r');
    const b = stackNames('b2', '/r');
    assert.notEqual(a.pgName, 'xangarro-pg');
    assert.notEqual(a.pgName, b.pgName);
    assert.notEqual(a.distDir, b.distDir);
    assert.notEqual(a.outboxDir, b.outboxDir);
  });

  it('refuses an id that could escape its folders or break a container name', () => {
    for (const id of ['', '../x', 'a/b', 'A B', 'x'.repeat(41)]) {
      assert.equal(
        code(() => stackNames(id, '/r')),
        'STACK_ID_INVALID',
        id,
      );
    }
  });
});

describe('the Docker VM disk check', () => {
  const df = (availKb: number) =>
    `Filesystem 1024-blocks Used Available Capacity Mounted on\noverlay 60000000 1 ${availKb} 50% /\n`;

  it('reads the available bytes from `df -Pk /`', () => {
    assert.equal(parseDfAvailableBytes(df(12_000_000)), 12_000_000 * 1024);
  });

  it('refuses under 10 GB free and allows at 10 GB', () => {
    assert.equal(
      code(() => assertDiskFree(MIN_FREE_BYTES - 1)),
      'DOCKER_DISK_LOW',
    );
    assert.equal(
      code(() => assertDiskFree(MIN_FREE_BYTES)),
      undefined,
    );
  });

  it('refuses output it cannot read, rather than guessing there is room', () => {
    for (const out of ['', 'Filesystem\n', 'overlay 1 2 lots 3% /\n']) {
      assert.equal(
        code(() => parseDfAvailableBytes(out)),
        'DOCKER_DF_UNREADABLE',
        out,
      );
    }
  });
});

describe('assertLocalUrl', () => {
  const allowed = ['127.0.0.1', 'localhost'] as const;

  it('allows a database or portal URL on an allowed host', () => {
    assert.equal(
      code(() => assertLocalUrl('postgres://u:p@localhost:55901/xangarro', allowed)),
      undefined,
    );
    assert.equal(
      code(() => assertLocalUrl('http://127.0.0.1:3901/login', allowed)),
      undefined,
    );
  });

  it('refuses any other host, including ones that only look local', () => {
    for (const url of [
      'postgres://u:p@db.supabase.co:5432/x',
      'http://localhost.evil.mx/',
      'http://127.0.0.2:3000/',
      'http://10.0.2.2:3000/',
    ]) {
      assert.equal(
        code(() => assertLocalUrl(url, allowed)),
        'HOST_NOT_ALLOWED',
        url,
      );
    }
  });

  it('refuses something that is not a URL at all', () => {
    assert.equal(
      code(() => assertLocalUrl('localhost:5432', allowed)),
      'HOST_NOT_ALLOWED',
    );
  });
});

describe('Teardown', () => {
  it('runs every step once, newest first, even when one throws', async () => {
    const ran: string[] = [];
    const t = new Teardown();
    t.add('container', async () => void ran.push('container'));
    t.add('build', async () => {
      ran.push('build');
      throw new Error('rm failed');
    });
    t.add('server', async () => void ran.push('server'));
    const failures = await t.run();
    await t.run();
    assert.deepEqual(ran, ['server', 'build', 'container']);
    assert.deepEqual(
      failures.map((f) => f.step),
      ['build'],
    );
  });

  it('two concurrent runs share one pass, so a signal during a failure does not double-remove', async () => {
    let n = 0;
    const t = new Teardown();
    t.add('container', async () => {
      n += 1;
    });
    await Promise.all([t.run(), t.run()]);
    assert.equal(n, 1);
  });
});
