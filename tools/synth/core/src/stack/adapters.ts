import { execFile, spawn } from 'node:child_process';
import { mkdirSync, openSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { promisify } from 'node:util';

import { locksDir } from './names';
import type { StackDeps, StackLock } from './stack';

/** The real side of `StackDeps`: processes, ports, files and HTTP on this machine. */
const run = promisify(execFile);

async function exec(
  cmd: string,
  args: readonly string[],
  opts: Parameters<StackDeps['exec']>[2] = {},
) {
  try {
    const { stdout } = await run(cmd, [...args], {
      env: { ...process.env, ...opts.env },
      cwd: opts.cwd,
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout;
  } catch (e) {
    const err = e as { stderr?: string; message: string };
    throw new Error(
      `${cmd} ${args.join(' ')} failed: ${(err.stderr ?? err.message).slice(-2_000)}`,
    );
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr !== null ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

export function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/** Signals the whole process group, which `spawnServer` makes the server lead. */
function signalGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal);
  } catch {
    // Already gone.
  }
}

async function stopGroup(pid: number): Promise<void> {
  signalGroup(pid, 'SIGTERM');
  for (let i = 0; i < 50 && pidAlive(pid); i += 1) await sleep(100);
  signalGroup(pid, 'SIGKILL');
}

/** `next start` in its own process group, logging to the corrida's folder. */
const spawnServer: StackDeps['spawnServer'] = async ({ cwd, env, port, logFile }) => {
  mkdirSync(dirname(logFile), { recursive: true });
  const log = openSync(logFile, 'a');
  const next = createRequire(join(cwd, 'package.json')).resolve('next/dist/bin/next');
  const child = spawn(process.execPath, [next, 'start', '-p', String(port)], {
    cwd,
    env: { ...process.env, ...env, NODE_ENV: 'production' },
    detached: true,
    stdio: ['ignore', log, log],
  });
  child.unref();
  const pid = child.pid;
  if (pid === undefined) throw new Error('next start did not spawn');
  return { pid, stop: () => stopGroup(pid) };
};

async function waitHttp(url: string, timeoutMs: number): Promise<void> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const r = await fetch(url, { redirect: 'manual' });
      if (r.status < 500) return;
    } catch {
      // Not listening yet.
    }
    await sleep(500);
  }
  throw new Error(`no answer on ${url} after ${Math.round(timeoutMs / 1000)}s`);
}

function listLocks(repoRoot: string): StackLock[] {
  const dir = locksDir(repoRoot);
  let names: string[];
  try {
    names = readdirSync(dir).filter((n) => n.endsWith('.json'));
  } catch {
    return [];
  }
  return names.flatMap((n) => {
    try {
      return [JSON.parse(readFileSync(join(dir, n), 'utf8')) as StackLock];
    } catch {
      return [];
    }
  });
}

export function nodeStackDeps(repoRoot: string): StackDeps {
  return {
    exec,
    freePort,
    spawnServer,
    waitHttp,
    writeLock(file, lock) {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${JSON.stringify(lock, null, 2)}\n`);
    },
    removeLock: (file) => rmSync(file, { force: true }),
    listLocks: () => listLocks(repoRoot),
    removeDir: (dir) => rm(dir, { recursive: true, force: true }),
    pidAlive,
    killGroup: (pid) => signalGroup(pid, 'SIGKILL'),
  };
}
