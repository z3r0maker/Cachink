import { spawn } from 'node:child_process';
import { join } from 'node:path';

/**
 * Maestro 2.5.1 runs every single-device test through one driver port (7001),
 * so two Maestro runs on this machine drive each other's devices. The
 * harness's machine-wide lock (`apps/mobile/maestro/scripts/lib/maestro-lock.sh`,
 * PR #184) is the guard; a phone run takes it before its first Maestro call
 * and keeps it to the end, by running itself again inside a shell that holds
 * it. `MAESTRO_LOCK_OWNER` tells the inner run it already has the lock.
 */
export const holdsMaestroLock = (): boolean => (process.env.MAESTRO_LOCK_OWNER ?? '') !== '';

/** The shell that takes the lock, runs `argv`, and frees it on exit (the lock's EXIT trap). */
export function lockedCommand(
  repoRoot: string,
  argv: readonly string[],
): { cmd: string; args: string[] } {
  const lib = join(repoRoot, 'apps/mobile/maestro/scripts/lib/maestro-lock.sh');
  const script = `source "${lib}" && maestro_lock_acquire || exit 1; "$@"; code=$?; exit $code`;
  return { cmd: 'bash', args: ['-c', script, 'synth-phone', ...argv] };
}

/** Re-runs this process under the lock and resolves with its exit code. */
export function rerunUnderMaestroLock(repoRoot: string): Promise<number> {
  const { cmd, args } = lockedCommand(repoRoot, [
    process.execPath,
    ...process.execArgv,
    ...process.argv.slice(1),
  ]);
  const child = spawn(cmd, args, { stdio: 'inherit' });
  return new Promise((resolve) => child.once('exit', (code) => resolve(code ?? 1)));
}
