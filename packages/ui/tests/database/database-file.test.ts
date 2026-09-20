/**
 * Database file adoption for the Cachink → Xangarro rename (ADR-056).
 *
 * The SQLite file moves from `cachink.db` to `xangarro.db`. An upgrade must
 * open the user's existing data, never a new empty database.
 */

import { describe, expect, it } from 'vitest';
import {
  DB_FILE_NAME,
  LEGACY_DB_FILE_NAME,
  resolveDatabaseFileName,
  type DatabaseFileOps,
} from '../../src/database/database-file.shared';

function memoryFs(initial: string[], failOn?: string): DatabaseFileOps & { files: Set<string> } {
  const files = new Set(initial);
  return {
    files,
    exists: async (name) => files.has(name),
    move: async (from, to) => {
      if (from === failOn) throw new Error(`cannot move ${from}`);
      files.delete(from);
      files.add(to);
    },
  };
}

describe('resolveDatabaseFileName', () => {
  it('moves the legacy database with its WAL and SHM sidecars', async () => {
    const fs = memoryFs(['cachink.db', 'cachink.db-wal', 'cachink.db-shm']);

    expect(await resolveDatabaseFileName(fs)).toBe(DB_FILE_NAME);
    expect([...fs.files].sort()).toEqual(['xangarro.db', 'xangarro.db-shm', 'xangarro.db-wal']);
  });

  it('opens the new name on a fresh install without touching anything', async () => {
    const fs = memoryFs([]);
    expect(await resolveDatabaseFileName(fs)).toBe(DB_FILE_NAME);
    expect(fs.files.size).toBe(0);
  });

  it('never overwrites an existing new database with a stale legacy file', async () => {
    const fs = memoryFs(['xangarro.db', 'cachink.db']);
    expect(await resolveDatabaseFileName(fs)).toBe(DB_FILE_NAME);
    expect(fs.files.has('cachink.db')).toBe(true);
  });

  it('opens the legacy file with its WAL back in place when the move fails', async () => {
    const fs = memoryFs(['cachink.db', 'cachink.db-wal'], 'cachink.db');
    expect(await resolveDatabaseFileName(fs)).toBe(LEGACY_DB_FILE_NAME);
    expect([...fs.files].sort()).toEqual(['cachink.db', 'cachink.db-wal']);
  });

  it('returns sidecars left by an earlier interrupted launch when the move fails again', async () => {
    const fs = memoryFs(['cachink.db', 'xangarro.db-wal'], 'cachink.db');
    expect(await resolveDatabaseFileName(fs)).toBe(LEGACY_DB_FILE_NAME);
    expect([...fs.files].sort()).toEqual(['cachink.db', 'cachink.db-wal']);
  });

  it('finishes an interrupted move on the next launch (sidecar already moved)', async () => {
    const fs = memoryFs(['cachink.db', 'xangarro.db-wal']);
    expect(await resolveDatabaseFileName(fs)).toBe(DB_FILE_NAME);
    expect([...fs.files].sort()).toEqual(['xangarro.db', 'xangarro.db-wal']);
  });
});
