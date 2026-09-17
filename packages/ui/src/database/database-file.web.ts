/**
 * Database file operations on desktop / Tauri (ADR-056).
 *
 * Uses the same base directory as `database-reset.web.ts` so adoption,
 * reset and backup all look at one location. If the fs plugin cannot load,
 * this throws rather than reporting "no file" and opening an empty database.
 */

import type * as TauriFsModule from '@tauri-apps/plugin-fs';
import type { DatabaseFileOps } from './database-file.shared';

type TauriFs = typeof TauriFsModule;

export async function loadWebDatabaseFileOps(): Promise<DatabaseFileOps> {
  const fs: TauriFs = await import('@tauri-apps/plugin-fs');
  const baseDir = fs.BaseDirectory.AppData;
  return {
    exists: (name) => fs.exists(name, { baseDir }),
    move: (from, to) => fs.rename(from, to, { oldPathBaseDir: baseDir, newPathBaseDir: baseDir }),
  };
}
