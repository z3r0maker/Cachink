/**
 * Re-export of the unified migration runner from `@cachink/data/migrator`.
 *
 * The runner now lives in `packages/data/src/migrator/` — the single
 * source of truth for both prod and tests. This file exists solely for
 * backward compatibility so existing imports from within `packages/ui`
 * continue to resolve.
 */

export {
  runMigrations,
  splitStatements,
  type RunMigrationsOptions,
  type BackupFn,
} from '@cachink/data/migrator';
