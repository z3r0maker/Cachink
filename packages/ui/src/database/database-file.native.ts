/**
 * Database file operations on mobile (ADR-056).
 *
 * expo-sqlite keeps databases in `<documentDirectory>SQLite/`. Uses the
 * `expo-file-system/legacy` entry: SDK 55's main entry only warns or throws
 * on the path-based API. The module is type-erased at the boundary like
 * `database-backup.native.ts`.
 *
 * If the module cannot load, this throws instead of reporting "no file":
 * reporting a missing legacy file would open an empty database over the
 * user's data.
 */

import type { DatabaseFileOps } from './database-file.shared';

type ExpoLegacyFsLike = {
  readonly documentDirectory: string | null;
  readonly getInfoAsync: (uri: string) => Promise<{ readonly exists: boolean }>;
  readonly moveAsync: (args: { from: string; to: string }) => Promise<void>;
};

export async function loadNativeDatabaseFileOps(): Promise<DatabaseFileOps> {
  const fs = (await import('expo-file-system/legacy')) as unknown as ExpoLegacyFsLike;
  if (!fs.documentDirectory) {
    throw new Error('[database-file] expo-file-system has no documentDirectory');
  }
  const dir = `${fs.documentDirectory}SQLite/`;
  return {
    exists: async (name) => (await fs.getInfoAsync(`${dir}${name}`)).exists,
    move: (from, to) => fs.moveAsync({ from: `${dir}${from}`, to: `${dir}${to}` }),
  };
}
