/**
 * Public surface of `@cachink/ui/database`.
 *
 * Re-exports from the shared entry, which in turn re-exports the platform
 * `DatabaseProvider`. Metro/Vite resolve the platform variant via the
 * extension pattern from CLAUDE.md §5.3.
 */

export {
  DatabaseContext,
  useDatabase,
  AsyncDatabaseProvider,
  TestDatabaseProvider,
  DatabaseProvider,
  runMigrations,
  splitStatements,
  type DatabaseProviderProps,
  type AsyncDatabaseProviderProps,
} from './database-provider';

export { formatBackupFilename, noopBackup, type BackupFn } from './database-backup';
export type { RunMigrationsOptions } from './run-migrations';
export { CloudDatabaseProvider, type CloudDatabaseProviderProps } from './cloud-database-provider';
