import type * as TauriFsModule from '@tauri-apps/plugin-fs';
import type SqlDatabase from '@tauri-apps/plugin-sql';
import type { ResetDatabaseFn } from './database-reset';

const DB_PATH = 'sqlite:cachink.db';
const DB_FILE_NAMES = ['cachink.db', 'cachink.db-shm', 'cachink.db-wal'] as const;

type TauriFs = typeof TauriFsModule;

async function loadModules(): Promise<{ Database: typeof SqlDatabase; fs: TauriFs } | null> {
  try {
    const [sql, fs] = await Promise.all([
      import('@tauri-apps/plugin-sql'),
      import('@tauri-apps/plugin-fs'),
    ]);
    return { Database: sql.default, fs };
  } catch {
    return null;
  }
}

export const webResetDatabase: ResetDatabaseFn = async () => {
  const modules = await loadModules();
  if (!modules) return;

  const db = await modules.Database.load(DB_PATH).catch(() => null);
  if (db) {
    await db.close().catch(() => false);
  }

  await Promise.all(
    DB_FILE_NAMES.map(async (name) => {
      const exists = await modules.fs.exists(name, { baseDir: modules.fs.BaseDirectory.AppData });
      if (!exists) return;
      await modules.fs.remove(name, { baseDir: modules.fs.BaseDirectory.AppData });
    }),
  );
};
