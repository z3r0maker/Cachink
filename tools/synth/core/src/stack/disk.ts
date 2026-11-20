import { StackError } from './errors';

/**
 * The Docker VM's disk is 58 GB, shared by every container on this machine,
 * and the host's free space says nothing about it. A corrida that fills it
 * breaks its neighbours' writes, so it refuses to start under 10 GB free.
 */
export const MIN_FREE_BYTES = 10 * 1024 ** 3;

/** The command that measures it: `df` inside a throwaway container sees the VM's disk. */
export const DF_COMMAND = ['run', '--rm', 'alpine', 'df', '-Pk', '/'] as const;

/** The available bytes from `df -Pk /` (POSIX output, 1024-byte blocks). */
export function parseDfAvailableBytes(stdout: string): number {
  const row = stdout.trim().split('\n')[1];
  const avail = row?.trim().split(/\s+/)[3];
  if (avail === undefined || !/^\d+$/.test(avail)) {
    throw new StackError(
      'DOCKER_DF_UNREADABLE',
      `cannot read the Docker VM's free space from: ${stdout.slice(0, 200)}`,
    );
  }
  return Number(avail) * 1024;
}

export function assertDiskFree(bytes: number): void {
  if (bytes < MIN_FREE_BYTES) {
    const gb = (bytes / 1024 ** 3).toFixed(1);
    throw new StackError(
      'DOCKER_DISK_LOW',
      `the Docker VM has ${gb} GB free; a corrida needs 10 GB`,
    );
  }
}
