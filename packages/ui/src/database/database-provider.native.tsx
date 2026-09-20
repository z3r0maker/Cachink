/**
 * DatabaseProvider — mobile (expo-sqlite) variant.
 *
 * Metro auto-picks this file over `./database-provider.tsx` on React
 * Native targets. The wiring:
 *   1. {@link resolveDatabaseFileName} adopts a pre-rebrand database file,
 *      then `openDatabaseSync` from `expo-sqlite` creates/opens the SQLite
 *      file under the app's sandboxed storage (ADR-056).
 *   2. `drizzle(native, { schema })` from `drizzle-orm/expo-sqlite` wraps
 *      it with the shared `XangarroDatabase` type.
 *   3. {@link runMigrations} applies any pending migrations from
 *      `@xangarro/data/migrations`.
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
import * as schema from '@xangarro/data/schema';
import type { XangarroDatabase } from '@xangarro/data';
import {
  AsyncDatabaseProvider,
  type DatabaseProviderProps,
  type AsyncDatabaseProviderProps,
} from './_internal';
import { nativeResetDatabase } from './database-reset.native';
import { resolveDatabaseFileName } from './database-file.shared';
import { loadNativeDatabaseFileOps } from './database-file.native';
import { registerNativeHandle } from './database-native-handle';
import { runMigrations } from './run-migrations';
import {
  getSchemaVersion,
  setSchemaVersion,
  checkSchemaCompatibility,
  SCHEMA_VERSION,
  SchemaVersionError,
} from '@xangarro/data/migrator';
import { logMigrationEvent } from '@xangarro/observability';

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
export { SCHEMA_VERSION, SchemaVersionError } from '@xangarro/data/migrator';

/** Open the database file, adopting a pre-rebrand `cachink.db` first (ADR-056). */
async function openNativeFile(): Promise<ReturnType<typeof openDatabaseSync>> {
  return openDatabaseSync(await resolveDatabaseFileName(await loadNativeDatabaseFileOps()));
}

async function createNativeDatabase(): Promise<XangarroDatabase> {
  const native = await openNativeFile();
  registerNativeHandle(native);
  try {
    // Enable FK enforcement before anything else (CLAUDE.md §conventions).
    // Must happen outside any transaction — pragma is a no-op inside one.
    native.execSync('PRAGMA foreign_keys = ON');
    native.execSync('PRAGMA journal_mode = WAL');
    const db = drizzle(native, { schema }) as unknown as XangarroDatabase;

    // Version gate: prevent old code from running against a newer schema.
    const dbVersion = await getSchemaVersion(db);
    const compat = checkSchemaCompatibility(dbVersion, SCHEMA_VERSION);

    switch (compat.status) {
      case 'ok':
        return db;
      case 'needs_migration': {
        const fromVersion = dbVersion;
        try {
          await runMigrations(db);
          await setSchemaVersion(db, SCHEMA_VERSION);
          await logMigrationEvent(native as never, 'success', '', {
            fromVersion,
            toVersion: SCHEMA_VERSION,
          });
        } catch (migrationError) {
          await logMigrationEvent(native as never, 'error', '', {
            fromVersion,
            toVersion: SCHEMA_VERSION,
            error:
              migrationError instanceof Error ? migrationError.message : String(migrationError),
          });
          throw migrationError;
        }
        return db;
      }
      case 'app_too_old':
        throw new SchemaVersionError(compat.dbVersion, compat.appVersion);
    }
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
