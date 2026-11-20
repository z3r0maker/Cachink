import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { StackError } from '../src/stack/errors';
import { reapOrphans } from '../src/stack/reap';
import { startStack, type StackDeps, type StackLock } from '../src/stack/stack';

/**
 * The corrida's stack, in the order it must happen, against fake processes.
 * `stack.integration.test.ts` brings a real one up (SYNTH_STACK=1).
 */
interface Call {
  readonly cmd: string;
  readonly args: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
}

const DF_ROOMY = 'Filesystem 1024-blocks Used Available Capacity Mounted on\no 1 1 20000000 1% /\n';
const DF_FULL = 'Filesystem 1024-blocks Used Available Capacity Mounted on\no 1 1 1000 99% /\n';

/** What `db-local.sh` prints for each URL it is asked for, on the container's port. */
const ROLE_OF: Readonly<Record<string, string>> = {
  url: 'xangarro_app',
  'super-url': 'postgres',
  'billing-url': 'billing',
};

function answer(args: readonly string[], port: string | undefined, df: string): string {
  if (args[0] === 'run') return df;
  const role = ROLE_OF[args[0] ?? ''];
  return role === undefined ? '' : `postgres://${role}:x@localhost:${port}/xangarro`;
}

function fake(
  over: Partial<StackDeps> & { df?: string; failOn?: RegExp; locks?: StackLock[] } = {},
) {
  const calls: Call[] = [];
  const locks = new Map<string, StackLock>((over.locks ?? []).map((l) => [`/l/${l.id}.json`, l]));
  const removed: string[] = [];
  const stopped: number[] = [];
  let port = 41_000;
  const deps: StackDeps = {
    async exec(cmd, args, opts) {
      calls.push({ cmd, args, ...(opts?.env ? { env: opts.env } : {}) });
      const line = `${cmd} ${args.join(' ')}`;
      if (over.failOn?.test(line)) throw new Error(`failed: ${line}`);
      return answer(args, opts?.env?.XG_PG_PORT, over.df ?? DF_ROOMY);
    },
    freePort: async () => (port += 1),
    async spawnServer({ port: p }) {
      calls.push({ cmd: 'next start', args: [String(p)] });
      if (over.failOn?.test('next start')) throw new Error('server would not start');
      return { pid: 7_000 + p, stop: async () => void stopped.push(p) };
    },
    waitHttp: over.waitHttp ?? (async () => undefined),
    writeLock: (file, lock) => void locks.set(file, lock),
    removeLock: (file) => void locks.delete(file),
    removeDir: async (dir) => void removed.push(dir),
    listLocks: () => [...locks.values()],
    pidAlive: over.pidAlive ?? (() => true),
    killGroup: (pid) => void stopped.push(pid),
  };
  return { deps, calls, locks, removed, stopped };
}

const OPTS = {
  id: 'c1',
  repoRoot: '/repo',
  today: '2026-11-19',
  allowedHosts: ['localhost', '127.0.0.1'] as const,
};
const lines = (calls: readonly Call[]) =>
  calls.map((c) => `${c.cmd.replace('/repo/packages/data-pg/scripts/', '')} ${c.args.join(' ')}`);

describe('startStack', () => {
  it('checks the disk, brings up its own Postgres, seeds, builds, starts and writes its lock', async () => {
    const f = fake();
    const stack = await startStack(f.deps, OPTS);
    assert.deepEqual(lines(f.calls), [
      'docker run --rm alpine df -Pk /',
      'db-local.sh up',
      'db-local.sh url',
      'db-local.sh super-url',
      'db-local.sh billing-url',
      'pnpm --filter @xangarro/data-pg db:seed',
      'pnpm --filter @xangarro/web exec next build --webpack',
      `next start ${stack.serverPort}`,
    ]);
    const up = f.calls[1];
    assert.equal(up?.env?.XG_PG_NAME, 'xangarro-pg-synth-c1');
    assert.equal(up?.env?.XG_PG_PORT, String(stack.pgPort));
    assert.equal(stack.baseUrl, `http://127.0.0.1:${stack.serverPort}`);
    assert.ok(stack.urls.database.includes(`:${stack.pgPort}/`));
    assert.deepEqual([...f.locks.keys()], ['/repo/tools/synth/reports/.stacks/c1.json']);
  });

  it('builds into its own folder, with its own outbox, as a production build', async () => {
    const f = fake();
    await startStack(f.deps, OPTS);
    const build = f.calls.find((c) => c.args.includes('build'));
    assert.equal(build?.env?.NEXT_DIST_DIR, '.next-synth/c1');
    assert.equal(build?.env?.NODE_ENV, 'production');
  });

  it('stop() removes the container with its volume, the build, the lock, and stops the server', async () => {
    const f = fake();
    const stack = await startStack(f.deps, OPTS);
    const failures = await stack.stop();
    assert.deepEqual(failures, []);
    assert.ok(lines(f.calls).includes('docker rm -f -v xangarro-pg-synth-c1'));
    assert.deepEqual(f.stopped, [stack.serverPort]);
    assert.ok(f.removed.includes('/repo/apps/web/.next-synth/c1'));
    assert.equal(f.locks.size, 0);
  });

  it('refuses to start under 10 GB free on the Docker VM, before creating anything', async () => {
    const f = fake({ df: DF_FULL });
    await assert.rejects(
      startStack(f.deps, OPTS),
      (e: unknown) => e instanceof StackError && e.code === 'DOCKER_DISK_LOW',
    );
    assert.deepEqual(lines(f.calls), ['docker run --rm alpine df -Pk /']);
    assert.equal(f.locks.size, 0);
  });

  it('a failed build tears down what was already up: no container is left behind', async () => {
    const f = fake({ failOn: /next build/ });
    await assert.rejects(startStack(f.deps, OPTS), /failed: pnpm/);
    assert.equal(lines(f.calls).at(-1), 'docker rm -f -v xangarro-pg-synth-c1');
    assert.ok(f.removed.includes('/repo/apps/web/.next-synth/c1'));
    assert.equal(f.locks.size, 0);
  });

  it('a Postgres that fails halfway up is still removed, since its removal is registered first', async () => {
    const f = fake({ failOn: /db-local\.sh up/ });
    await assert.rejects(startStack(f.deps, OPTS));
    assert.ok(lines(f.calls).includes('docker rm -f -v xangarro-pg-synth-c1'));
  });

  it('a server that never answers is stopped and the stack torn down', async () => {
    const f = fake({ waitHttp: async () => Promise.reject(new Error('no answer on /login')) });
    await assert.rejects(startStack(f.deps, OPTS), /no answer/);
    assert.equal(f.stopped.length, 1);
    assert.ok(lines(f.calls).includes('docker rm -f -v xangarro-pg-synth-c1'));
  });

  it('refuses a database URL on a host outside allowed_hosts, and tears down', async () => {
    const f = fake();
    const opts = { ...OPTS, allowedHosts: ['127.0.0.1'] as const };
    await assert.rejects(
      startStack(f.deps, opts),
      (e: unknown) => e instanceof StackError && e.code === 'HOST_NOT_ALLOWED',
    );
    assert.ok(lines(f.calls).includes('docker rm -f -v xangarro-pg-synth-c1'));
  });

  it('without a server (database only), skips the build and start but still writes its lock', async () => {
    const f = fake();
    const stack = await startStack(f.deps, { ...OPTS, server: false });
    assert.equal(stack.baseUrl, undefined);
    assert.ok(!lines(f.calls).some((l) => l.includes('next')));
    assert.equal(f.locks.size, 1);
  });

  it('two corridas side by side get different containers, ports and folders', async () => {
    const f = fake();
    const [a, b] = await Promise.all([
      startStack(f.deps, OPTS),
      startStack(f.deps, { ...OPTS, id: 'c2' }),
    ]);
    assert.notEqual(a.pgName, b.pgName);
    assert.notEqual(a.pgPort, b.pgPort);
    assert.notEqual(a.serverPort, b.serverPort);
    assert.notEqual(a.urls.database, b.urls.database);
  });
});

describe('reapOrphans', () => {
  const lock = (id: string, pid: number): StackLock => ({
    id,
    pid,
    pgName: `xangarro-pg-synth-${id}`,
    serverPid: 9_000 + pid,
    distDir: `/repo/apps/web/.next-synth/${id}`,
    lockFile: `/l/${id}.json`,
  });

  it('removes what a killed corrida left: its server, container, build and lock', async () => {
    const f = fake({ locks: [lock('dead', 1), lock('alive', 2)], pidAlive: (pid) => pid === 2 });
    const reaped = await reapOrphans(f.deps);
    assert.deepEqual(reaped, ['dead']);
    assert.deepEqual(lines(f.calls), ['docker rm -f -v xangarro-pg-synth-dead']);
    assert.deepEqual(f.stopped, [9_001]);
    assert.deepEqual(f.removed, ['/repo/apps/web/.next-synth/dead']);
    assert.deepEqual([...f.locks.keys()], ['/l/alive.json']);
  });

  it('leaves every lock of a live corrida alone', async () => {
    const f = fake({ locks: [lock('a', 1)], pidAlive: () => true });
    assert.deepEqual(await reapOrphans(f.deps), []);
    assert.deepEqual(f.calls, []);
  });

  it('reaps a database-only corrida, which has no server to stop', async () => {
    const f = fake({ locks: [{ ...lock('db', 3), serverPid: null }], pidAlive: () => false });
    await reapOrphans(f.deps);
    assert.deepEqual(f.stopped, []);
    assert.deepEqual(lines(f.calls), ['docker rm -f -v xangarro-pg-synth-db']);
  });

  it('startStack reaps first, so a crashed corrida’s container never outlives the next start', async () => {
    const f = fake({ locks: [lock('old', 4)], pidAlive: (pid) => pid !== 4 });
    await startStack(f.deps, { ...OPTS, server: false });
    assert.equal(lines(f.calls)[0], 'docker rm -f -v xangarro-pg-synth-old');
  });
});
