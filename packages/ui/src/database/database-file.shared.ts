/**
 * SQLite file name and pre-rebrand file adoption (ADR-056).
 *
 * `.shared` suffix: a bare `./database-file` import would resolve to the
 * `.native` / `.web` adapter on Metro / Vite (see database-backup.shared.ts).
 *
 * Installs from before the Cachink → Xangarro rename keep their data in
 * `cachink.db`. Before opening, the platform provider calls
 * {@link resolveDatabaseFileName}, which moves the legacy file and its
 * WAL/SHM sidecars to the new name and returns the name to open.
 *
 * Crash and failure safety:
 *   - Sidecars move first, the main file last. If the app dies midway, the
 *     legacy main file is still there and the next launch finishes the job.
 *   - If a move throws, every sidecar at the new name is moved back and the
 *     legacy name is returned. A WAL separated from its main file would lose
 *     unflushed writes, and opening an empty new database would hide the
 *     user's data.
 *   - An existing new database is never overwritten.
 */

/** SQLite file name on device storage. Changing this breaks existing users. */
export const DB_FILE_NAME = 'xangarro.db';

/** Legacy file name — kept only to upgrade pre-rebrand installs. */
export const LEGACY_DB_FILE_NAME = 'cachink.db';

const SIDECAR_SUFFIXES = ['-wal', '-shm'] as const;

/** Every file SQLite may own for a database name (main + sidecars). */
export function databaseFileSet(name: string): readonly string[] {
  return [name, ...SIDECAR_SUFFIXES.map((s) => `${name}${s}`)];
}

/** Minimal file operations, relative to the platform's database directory. */
export interface DatabaseFileOps {
  exists(name: string): Promise<boolean>;
  move(from: string, to: string): Promise<void>;
}

async function moveIfPresent(fs: DatabaseFileOps, from: string, to: string): Promise<void> {
  if ((await fs.exists(from)) && !(await fs.exists(to))) await fs.move(from, to);
}

async function returnSidecars(fs: DatabaseFileOps): Promise<void> {
  for (const suffix of SIDECAR_SUFFIXES) {
    try {
      await moveIfPresent(fs, `${DB_FILE_NAME}${suffix}`, `${LEGACY_DB_FILE_NAME}${suffix}`);
    } catch (error) {
      console.error('[database-file] could not restore sidecar', suffix, error);
    }
  }
}

/** Adopt a legacy database file if needed; returns the file name to open. */
export async function resolveDatabaseFileName(fs: DatabaseFileOps): Promise<string> {
  if (await fs.exists(DB_FILE_NAME)) return DB_FILE_NAME;
  if (!(await fs.exists(LEGACY_DB_FILE_NAME))) return DB_FILE_NAME;
  try {
    for (const suffix of SIDECAR_SUFFIXES) {
      await moveIfPresent(fs, `${LEGACY_DB_FILE_NAME}${suffix}`, `${DB_FILE_NAME}${suffix}`);
    }
    await fs.move(LEGACY_DB_FILE_NAME, DB_FILE_NAME);
    return DB_FILE_NAME;
  } catch (error) {
    console.error('[database-file] keeping legacy database file', error);
    await returnSidecars(fs);
    return LEGACY_DB_FILE_NAME;
  }
}
