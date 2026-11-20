import assert from 'node:assert/strict';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

import { asOwner } from '@xangarro/testing/tenant';
import { describe, it } from 'vitest';

/**
 * S-04's acceptance against real Docker: two corridas side by side never share
 * a database or a port, a corrida that is signalled tears down, and one that
 * is killed outright is reaped. Opt-in (`pnpm --filter @xangarro/synth-core
 * test:stack`), since it starts containers and takes about a minute.
 *
 * The stacks are database-only (`--no-server`): the portal build takes minutes
 * and adds nothing to isolation, which is about containers, ports and folders.
 */
const CORE = resolve(import.meta.dirname, '..');
const REPO = resolve(CORE, '../../..');
const RUN = process.env.SYNTH_STACK === '1';

interface Ready {
  readonly id: string;
  readonly pgName: string;
  readonly pgPort: number;
  readonly urls: {
    readonly database: string;
    readonly superUser: string;
    readonly billing: string;
  };
  readonly access: { readonly tenant: { readonly biz: string } } | null;
}

/** The CLI as its own node process, so a signal reaches it and not a wrapper. */
function cli(args: readonly string[]): ChildProcess {
  return spawn(process.execPath, ['--import', 'tsx', 'src/cli/stack.ts', ...args], {
    cwd: CORE,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function ready(child: ChildProcess): Promise<Ready> {
  return new Promise((done, fail) => {
    let err = '';
    child.stderr?.on('data', (b: Buffer) => (err += b.toString()));
    createInterface({ input: child.stdout! }).on('line', (line) => {
      if (line.startsWith('{"ready"')) done((JSON.parse(line) as { ready: Ready }).ready);
    });
    child.once('exit', (code) => fail(new Error(`stack exited ${code}: ${err.slice(-2000)}`)));
  });
}

const exited = (child: ChildProcess) =>
  new Promise<number | null>((done) =>
    child.once('exit', (code, signal) => done(code ?? (signal ? -1 : null))),
  );

const containerExists = (name: string) =>
  spawnSync('docker', ['inspect', name], { stdio: 'ignore' }).status === 0;
const lockFile = (id: string) => join(REPO, 'tools/synth/reports/.stacks', `${id}.json`);

async function countBusiness(superUrl: string, biz: string): Promise<number> {
  process.env.DATABASE_SUPER_URL = superUrl;
  const rows = await asOwner((sql) => sql`SELECT count(*) AS n FROM businesses WHERE id = ${biz}`);
  return Number(rows[0]?.n);
}

describe.skipIf(!RUN)('a corrida’s stack, for real', () => {
  it('two corridas never share a database or a port; a signalled one tears down; a killed one is reaped', async () => {
    const tag = randomBytes(3).toString('hex');
    const [ida, idb] = [`it-a-${tag}`, `it-b-${tag}`];
    const a = cli([
      'up',
      '--id',
      ida,
      '--no-server',
      '--seed',
      'negocio-con-catalogo-minimo',
      '--auth-as',
      'operador',
    ]);
    const b = cli(['up', '--id', idb, '--no-server']);
    const [ra, rb] = await Promise.all([ready(a), ready(b)]);

    // Side by side, nothing shared.
    assert.notEqual(ra.pgName, rb.pgName);
    assert.notEqual(ra.pgPort, rb.pgPort);
    assert.ok(containerExists(ra.pgName) && containerExists(rb.pgName));
    const biz = ra.access?.tenant.biz ?? '';
    assert.equal(
      await countBusiness(ra.urls.superUser, biz),
      1,
      'the run’s tenant is in its own corrida',
    );
    assert.equal(await countBusiness(rb.urls.superUser, biz), 0, 'and not in the other');

    // Signalled: it tears down before it exits.
    a.kill('SIGTERM');
    assert.equal(await exited(a), 143);
    assert.equal(containerExists(ra.pgName), false, 'a SIGTERM leaves no container');
    assert.equal(existsSync(lockFile(ida)), false);

    // Killed outright: nothing runs, the lock stays, and the reaper removes the rest.
    b.kill('SIGKILL');
    await exited(b);
    assert.equal(containerExists(rb.pgName), true, 'SIGKILL cannot be caught');
    assert.equal(existsSync(lockFile(idb)), true);
    const reap = cli(['reap']);
    let out = '';
    reap.stdout?.on('data', (d: Buffer) => (out += d.toString()));
    assert.equal(await exited(reap), 0);
    assert.ok((JSON.parse(out) as { reaped: string[] }).reaped.includes(idb));
    assert.equal(containerExists(rb.pgName), false, 'the reaper removed it');
    assert.equal(existsSync(lockFile(idb)), false);
  }, 300_000);
});
