import type { StackDeps, StackLock } from './stack';

/**
 * A corrida killed with SIGKILL, or a machine that lost power, runs no
 * teardown. Its lock file outlives it, naming its process, container, server
 * and build, so the next corrida's start (or `stack:reap`) removes them.
 */

/** `docker rm -f -v`, where a container already gone is not a failure. */
export async function removeContainer(deps: Pick<StackDeps, 'exec'>, name: string): Promise<void> {
  try {
    await deps.exec('docker', ['rm', '-f', '-v', name]);
  } catch (e) {
    if (!/No such container/i.test(e instanceof Error ? e.message : String(e))) throw e;
  }
}

async function reapOne(deps: StackDeps, lock: StackLock): Promise<void> {
  if (lock.serverPid !== null) deps.killGroup(lock.serverPid);
  await removeContainer(deps, lock.pgName);
  await deps.removeDir(lock.distDir);
  deps.removeLock(lock.lockFile);
}

/** Removes every stack whose owning process is gone, and returns their ids. */
export async function reapOrphans(deps: StackDeps): Promise<string[]> {
  const dead = deps.listLocks().filter((l) => !deps.pidAlive(l.pid));
  for (const lock of dead) await reapOne(deps, lock);
  return dead.map((l) => l.id);
}
