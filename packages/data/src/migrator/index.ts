/**
 * Migrator barrel — the single source of truth for schema migration
 * and version gating.
 *
 * Consumers:
 *   - `packages/ui/src/database/` (thin re-export for platform providers)
 *   - `packages/data/tests/helpers/fresh-db.ts` (test harness)
 *   - `packages/sync-lan/tests/helpers/fresh-db.ts` (test harness)
 */

export { runMigrations, type RunMigrationsOptions, type BackupFn } from './run-migrations.js';
export { splitStatements } from './split-statements.js';
export { MigrationError, SchemaVersionError } from './errors.js';
export {
  SCHEMA_VERSION,
  getSchemaVersion,
  setSchemaVersion,
  checkSchemaCompatibility,
  type VersionCheckResult,
} from './schema-version.js';
