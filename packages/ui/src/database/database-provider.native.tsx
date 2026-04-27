/**
 * DatabaseProvider — mobile (expo-sqlite) variant.
 *
 * Metro auto-picks this file over `./database-provider.tsx` on React
 * Native targets. The wiring:
 *   1. `openDatabaseSync('cachink.db')` from `expo-sqlite` creates/opens
 *      the SQLite file under the app's sandboxed storage.
 *   2. `drizzle(native, { schema })` from `drizzle-orm/expo-sqlite` wraps
 *      it with the shared `CachinkDatabase` type.
 *   3. {@link runMigrations} applies any pending migrations from
 *      `@cachink/data/migrations`.
 *   4. Children mount once the db is ready.
 *
 * Why we don't use Drizzle's `useMigrations` hook: it's bundled with the
 * expo driver and differs from the Tauri-side sqlite-proxy migrator. Our
 * `runMigrations` works on both, so the two platform variants stay
 * symmetrical.
 */

import { useCallback, type ReactElement } from 'react';
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@cachink/data/schema';
import type { CachinkDatabase } from '@cachink/data';
import {
  AsyncDatabaseProvider,
  type DatabaseProviderProps,
  type AsyncDatabaseProviderProps,
} from './_internal';
import { nativeResetDatabase } from './database-reset.native';
import { runMigrations } from './run-migrations';

// Mirror the surface of `./database-provider.tsx` so the barrel
// `./index.ts` can re-export the same names regardless of which
// platform variant Metro/Vite resolves. Without these re-exports,
// `useDatabase` / `DatabaseContext` etc. silently become `undefined`
// in the iOS bundle and consumers crash with
// "useDatabase is not a function".
export { DatabaseContext, useDatabase, TestDatabaseProvider } from './_internal';
export { AsyncDatabaseProvider };
export type { DatabaseProviderProps, AsyncDatabaseProviderProps };
export { runMigrations, splitStatements } from './run-migrations';

/** SQLite file name on device storage. Changing this breaks existing users. */
const DB_FILE_NAME = 'cachink.db';

async function createNativeDatabase(): Promise<CachinkDatabase> {
  const native = openDatabaseSync(DB_FILE_NAME);
  try {
    const db = drizzle(native, { schema }) as unknown as CachinkDatabase;
    await runMigrations(db);
    return db;
  } catch (error) {
    native.closeSync();
    throw error;
  }
}

export function DatabaseProvider(props: DatabaseProviderProps): ReactElement | null {
  // Memoize so AsyncDatabaseProvider's useEffect dep array stays stable.
  const create = useCallback(createNativeDatabase, []);
  const asyncProps: AsyncDatabaseProviderProps = {
    children: props.children,
    database: props.database,
    create,
    reset: nativeResetDatabase,
  };
  return <AsyncDatabaseProvider {...asyncProps} />;
}
