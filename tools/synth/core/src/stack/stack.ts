import { join } from 'node:path';

import { assertDiskFree, DF_COMMAND, parseDfAvailableBytes } from './disk';
import { assertLocalUrl } from './hosts';
import { stackNames, type StackNames } from './names';
import { reapOrphans, removeContainer } from './reap';
import { stackServerEnv, type DbUrls } from './server-env';
import { Teardown, type TeardownFailure } from './teardown';

/**
 * A corrida's stack (S-04, ADR-153 §3): its own Postgres container on a free
 * port, migrated and seeded through `db-local.sh`, one production build of the
 * portal in its own folder, and `next start` on another free port. It is torn
 * down when the corrida ends, failure included; a corrida that dies without
 * tearing down leaves a lock file the next start reaps.
 *
 * Every side effect goes through `StackDeps`, so the order is tested against
 * fakes (`tests/stack.test.ts`) and the real thing is `adapters.ts`.
 */
export interface StackLock {
  readonly id: string;
  /** The process that owns the stack: when it is gone, the stack is an orphan. */
  readonly pid: number;
  readonly pgName: string;
  /** The server's process group, or `null` for a database-only stack. */
  readonly serverPid: number | null;
  /** Absolute. */
  readonly distDir: string;
  readonly lockFile: string;
}

export interface ExecOptions {
  readonly env?: Readonly<Record<string, string>>;
  readonly cwd?: string;
}

export interface StackDeps {
  /** Runs a command to completion and returns its stdout; rejects on a non-zero exit. */
  exec(cmd: string, args: readonly string[], opts?: ExecOptions): Promise<string>;
  freePort(): Promise<number>;
  spawnServer(a: {
    readonly cwd: string;
    readonly env: Readonly<Record<string, string>>;
    readonly port: number;
    readonly logFile: string;
  }): Promise<{ readonly pid: number; stop(): Promise<void> }>;
  waitHttp(url: string, timeoutMs: number): Promise<void>;
  writeLock(file: string, lock: StackLock): void;
  removeLock(file: string): void;
  listLocks(): StackLock[];
  removeDir(dir: string): Promise<void>;
  pidAlive(pid: number): boolean;
  killGroup(pid: number): void;
}

export interface StackOptions {
  /** The corrida's id: names its container, build, outbox and lock. */
  readonly id: string;
  readonly repoRoot: string;
  /** The server's business day (`PORTAL_TODAY`). */
  readonly today: string;
  readonly allowedHosts: readonly string[];
  /** `false` brings up the database alone (seeding, tests). Defaults to `true`. */
  readonly server?: boolean;
  readonly waitMs?: number;
}

export interface Stack {
  readonly id: string;
  readonly names: StackNames;
  readonly pgName: string;
  readonly pgPort: number;
  readonly urls: DbUrls;
  readonly serverPort?: number;
  readonly baseUrl?: string;
  /** Tears everything down; safe to call more than once. */
  stop(): Promise<TeardownFailure[]>;
}

interface Ctx {
  readonly deps: StackDeps;
  readonly o: StackOptions;
  readonly names: StackNames;
  readonly teardown: Teardown;
}

const dbLocal = (o: StackOptions): string =>
  join(o.repoRoot, 'packages/data-pg/scripts/db-local.sh');

async function upDatabase(c: Ctx, pgPort: number): Promise<DbUrls> {
  const env = { XG_PG_NAME: c.names.pgName, XG_PG_PORT: String(pgPort) };
  c.teardown.add('container', () => removeContainer(c.deps, c.names.pgName));
  await c.deps.exec(dbLocal(c.o), ['up'], { env });
  const ask = async (what: string) => (await c.deps.exec(dbLocal(c.o), [what], { env })).trim();
  const urls = {
    database: await ask('url'),
    superUser: await ask('super-url'),
    billing: await ask('billing-url'),
  };
  for (const url of Object.values(urls)) assertLocalUrl(url, c.o.allowedHosts);
  await c.deps.exec('pnpm', ['--filter', '@xangarro/data-pg', 'db:seed'], {
    env,
    cwd: c.o.repoRoot,
  });
  return urls;
}

/** `next/font` fetching the portal's Google Fonts at build time: a network blip, worth one more try. */
const FONT_FETCH = /Failed to fetch `[^`]+` from Google Fonts/;

/** One production build of the portal, retried once when only the font fetch failed. */
async function buildPortal(c: Ctx, env: Record<string, string>): Promise<void> {
  const build = ['--filter', '@xangarro/web', 'exec', 'next', 'build', '--webpack'];
  const opts = { env: { ...env, NODE_ENV: 'production' }, cwd: c.o.repoRoot };
  try {
    await c.deps.exec('pnpm', build, opts);
  } catch (e) {
    if (!FONT_FETCH.test(e instanceof Error ? e.message : String(e))) throw e;
    await c.deps.exec('pnpm', build, opts);
  }
}

async function upServer(
  c: Ctx,
  urls: DbUrls,
  lock: StackLock,
): Promise<{ port: number; baseUrl: string }> {
  const web = join(c.o.repoRoot, 'apps/web');
  c.teardown.add('build', () => c.deps.removeDir(join(web, c.names.distDir)));
  const env = stackServerEnv(urls, c.o.today, c.names);
  await buildPortal(c, env);
  const port = await c.deps.freePort();
  const server = await c.deps.spawnServer({ cwd: web, env, port, logFile: c.names.serverLog });
  c.teardown.add('server', () => server.stop());
  c.deps.writeLock(c.names.lockFile, { ...lock, serverPid: server.pid });
  const baseUrl = `http://127.0.0.1:${port}`;
  await c.deps.waitHttp(`${baseUrl}/login`, c.o.waitMs ?? 180_000);
  return { port, baseUrl };
}

async function bringUp(c: Ctx): Promise<Stack> {
  const lock: StackLock = {
    id: c.o.id,
    pid: process.pid,
    pgName: c.names.pgName,
    serverPid: null,
    distDir: join(c.o.repoRoot, 'apps/web', c.names.distDir),
    lockFile: c.names.lockFile,
  };
  // The lock goes first and comes off last, so a kill at any point is reapable.
  c.deps.writeLock(c.names.lockFile, lock);
  c.teardown.add('lock', async () => c.deps.removeLock(c.names.lockFile));
  const pgPort = await c.deps.freePort();
  const urls = await upDatabase(c, pgPort);
  const server = c.o.server === false ? undefined : await upServer(c, urls, lock);
  return {
    id: c.o.id,
    names: c.names,
    pgName: c.names.pgName,
    pgPort,
    urls,
    ...(server === undefined ? {} : { serverPort: server.port, baseUrl: server.baseUrl }),
    stop: () => c.teardown.run(),
  };
}

export async function startStack(deps: StackDeps, o: StackOptions): Promise<Stack> {
  const names = stackNames(o.id, o.repoRoot);
  await reapOrphans(deps);
  assertDiskFree(parseDfAvailableBytes(await deps.exec('docker', [...DF_COMMAND])));
  const c: Ctx = { deps, o, names, teardown: new Teardown() };
  try {
    return await bringUp(c);
  } catch (e) {
    await c.teardown.run();
    throw e;
  }
}
