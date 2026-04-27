/**
 * Database backup on desktop — uses Tauri's fs plugin to copy the
 * SQLite file next to the original (P1C-M12-T03, S4-C17).
 *
 * The plugin APIs are dynamically imported so Vitest / Vite dev server
 * never hard-depend on the Tauri runtime.
 */

import type * as TauriFsModule from '@tauri-apps/plugin-fs';
import { formatBackupFilename, type BackupFn } from './database-backup.shared';

type TauriFs = typeof TauriFsModule;

async function loadFs(): Promise<TauriFs | null> {
  try {
    return await import('@tauri-apps/plugin-fs');
  } catch {
    return null;
  }
}

export const webBackup: BackupFn = async (tag) => {
  const fs = await loadFs();
  if (!fs) return 'unavailable';
  const filename = formatBackupFilename(tag);
  // Tauri's `copyFile` runs against the app's data-dir by default.
  await fs.copyFile('cachink.db', `backups/${filename}`, {
    fromPathBaseDir: fs.BaseDirectory.AppData,
    toPathBaseDir: fs.BaseDirectory.AppData,
  } as never);
  return `backups/${filename}`;
};
