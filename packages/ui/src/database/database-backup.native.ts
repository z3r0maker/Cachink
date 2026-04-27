/**
 * Database backup on mobile — uses expo-sqlite's `serialize()` +
 * expo-file-system write (P1C-M12-T03, S4-C17).
 *
 * Keeps the last 3 backups; older files are deleted. 50 MB × 10
 * backups = 500 MB disk tax was the original concern (risk #7 in the
 * Slice 4 plan).
 */

import { formatBackupFilename, type BackupFn } from './database-backup.shared';

/**
 * The expo-file-system API surface changes between SDK minor
 * versions (SDK 55 removed top-level `documentDirectory` and moved it
 * under `FileSystem.documentDirectory` in v19). We type-erase the
 * module at the boundary to stay version-agnostic; the runtime shape
 * is validated by the Maestro E2E flow in C22.
 */
type ExpoFsLike = {
  readonly documentDirectory?: string;
  readonly makeDirectoryAsync: (path: string, opts?: { intermediates?: boolean }) => Promise<void>;
  readonly copyAsync: (args: { from: string; to: string }) => Promise<void>;
  readonly readDirectoryAsync: (path: string) => Promise<readonly string[]>;
  readonly deleteAsync: (path: string, opts?: { idempotent?: boolean }) => Promise<void>;
};

async function loadFs(): Promise<ExpoFsLike | null> {
  try {
    const mod = (await import('expo-file-system')) as unknown as ExpoFsLike;
    return mod;
  } catch {
    return null;
  }
}

export const nativeBackup: BackupFn = async (tag) => {
  const fs = await loadFs();
  if (!fs) return 'unavailable';
  const dir = `${fs.documentDirectory ?? ''}backups/`;
  await fs.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const path = `${dir}${formatBackupFilename(tag)}`;
  const source = `${fs.documentDirectory ?? ''}SQLite/cachink.db`;
  await fs.copyAsync({ from: source, to: path });
  await pruneOldBackups(fs, dir, 3);
  return path;
};

async function pruneOldBackups(fs: ExpoFsLike, dir: string, keep: number): Promise<void> {
  const entries = await fs.readDirectoryAsync(dir);
  if (entries.length <= keep) return;
  const sorted = [...entries].sort();
  const toDelete = sorted.slice(0, sorted.length - keep);
  await Promise.all(toDelete.map((name) => fs.deleteAsync(`${dir}${name}`, { idempotent: true })));
}
