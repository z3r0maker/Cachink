/**
 * Driver-agnostic migration runner — the single source of truth.
 *
 * Executes the SQL from `@cachink/data/migrations` on any Drizzle-wrapped
 * SQLite connection — expo-sqlite (mobile), Tauri sqlite-proxy (desktop),
 * or better-sqlite3 (tests). Tracks applied migrations in a bookkeeping
 * table `__cachink_migrations` so re-runs are idempotent.
 *
 * Moved from `packages/ui/src/database/run-migrations.ts` to eliminate
 * the dual-runner problem (tests used Drizzle's filesystem-based migrator
 * while prod used this custom runner — they could silently diverge).
 *
 * Key design choices:
 *   - Each migration is wrapped in a transaction (`BEGIN IMMEDIATE` /
 *     `COMMIT` / `ROLLBACK`) so the `__cachink_migrations` INSERT is
 *     atomic with the DDL. If a migration crashes mid-way, the tag is
 *     NOT recorded and retry is safe.
 *   - `PRAGMA user_version` is set to {@link SCHEMA_VERSION} after all
 *     pending migrations apply.
 *   - Statements are split on the `--> statement-breakpoint` marker that
 *     Drizzle Kit emits between DDL statements.
 *   - Tag recording uses inlined values rather than bound parameters
 *     because `sql.raw` is the only universal escape hatch across the
 *     three drivers — safe here because tags come from the committed
 *     journal, never user input.
 */

import { sql } from 'drizzle-orm';
import type { CachinkDatabase } from '../repositories/drizzle/_db.js';
import migrationsBundle, { migrationSqlByTag } from '../../drizzle/migrations/index.js';
import { splitStatements } from './split-statements.js';
import { MigrationError } from './errors.js';
import { SCHEMA_VERSION, setSchemaVersion } from './schema-version.js';

const MIGRATIONS_TABLE = '__cachink_migrations';

const CREATE_TRACKER_SQL = `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
  tag TEXT PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL
)`;

/**
 * Row shape returned by `db.all(sql.raw(...))` — varies by driver.
 * `better-sqlite3` gives named objects; `sqlite-proxy` gives column-value
 * arrays. We normalize both in {@link loadAppliedTags}.
 */
type RawRow = Readonly<Record<string, unknown>> | readonly unknown[];

function readTag(row: RawRow): string | null {
  if (Array.isArray(row)) {
    return typeof row[0] === 'string' ? row[0] : null;
  }
  const record = row as Readonly<Record<string, unknown>>;
  const tag = record['tag'];
  return typeof tag === 'string' ? tag : null;
}

/** Read applied-migration tags. Returns an empty set on a fresh database. */
async function loadAppliedTags(db: CachinkDatabase): Promise<ReadonlySet<string>> {
  const rows = (await db.all(sql.raw(`SELECT tag FROM ${MIGRATIONS_TABLE}`))) as RawRow[];
  const tags = new Set<string>();
  for (const row of rows) {
    const tag = readTag(row);
    if (tag !== null) tags.add(tag);
  }
  return tags;
}

/**
 * Callback invoked before the first pending migration executes.
 * Receives the tag of the first pending migration; returns the backup
 * path for diagnostics. Not called when nothing is pending.
 */
export type BackupFn = (tagBeingApplied: string) => Promise<string>;

export interface RunMigrationsOptions {
  /**
   * Optional backup hook called once per runMigrations() invocation
   * when at least one pending migration exists. Called with the first
   * pending migration tag; the returned path is retained for
   * diagnostics. Not called when nothing is pending.
   */
  readonly backupBefore?: BackupFn;
  /**
   * Skip BEGIN/COMMIT transaction wrapping around each migration.
   * Required for drivers whose connection pool dispatches each
   * `execute()` on a different connection (e.g. Tauri plugin-sql),
   * making manual transaction state invisible across calls.
   */
  readonly skipTransactions?: boolean;
}

/**
 * Module-level mutex — prevents concurrent migration runs caused by
 * React.StrictMode double-mounting effects in dev mode. The second
 * caller awaits the first run's promise.
 */
let migrationPromise: Promise<void> | null = null;

/**
 * Apply any pending migrations in journal order. Safe to call on every
 * app launch — the bookkeeping table skips already-applied migrations.
 *
 * Each migration is wrapped in a transaction so failures don't leave
 * the DB in a half-migrated state with no rollback.
 *
 * After all migrations apply, sets `PRAGMA user_version` to
 * {@link SCHEMA_VERSION} for the version gate.
 */
export async function runMigrations(
  db: CachinkDatabase,
  options: RunMigrationsOptions = {},
): Promise<void> {
  if (migrationPromise) return migrationPromise;
  migrationPromise = runMigrationsInternal(db, options);
  try {
    await migrationPromise;
  } finally {
    migrationPromise = null;
  }
}

/** Resolve the SQL for a migration tag, or throw if missing. */
function resolveMigrationSql(tag: string): string {
  const raw = migrationSqlByTag[tag];
  if (!raw) {
    throw new MigrationError(
      tag,
      new Error(
        `Migration '${tag}' is listed in the journal but missing ` +
          `from migrationSqlByTag. Did you forget to register its SQL ` +
          `in @cachink/data/drizzle/migrations/index.ts?`,
      ),
    );
  }
  return raw;
}

/** Apply a single migration, optionally inside a transaction. */
async function applySingleMigration(
  db: CachinkDatabase,
  tag: string,
  migrationSql: string,
  skipTx: boolean,
): Promise<void> {
  if (!skipTx) await db.run(sql.raw('BEGIN IMMEDIATE'));
  try {
    for (const statement of splitStatements(migrationSql)) {
      await db.run(sql.raw(statement));
    }

    const appliedAt = new Date().toISOString();
    await db.run(
      sql.raw(
        `INSERT INTO ${MIGRATIONS_TABLE} (tag, applied_at) VALUES ('${tag}', '${appliedAt}')`,
      ),
    );

    if (!skipTx) await db.run(sql.raw('COMMIT'));
  } catch (error) {
    if (!skipTx) {
      try {
        await db.run(sql.raw('ROLLBACK'));
      } catch {
        // ROLLBACK itself may fail if the DB is in a weird state.
      }
    }
    throw new MigrationError(tag, error);
  }
}

/** Run optional backup before applying pending migrations. */
async function runBackupIfNeeded(options: RunMigrationsOptions, firstTag: string): Promise<void> {
  if (!options.backupBefore) return;
  try {
    await options.backupBefore(firstTag);
  } catch {
    // Backup failure must not block migration.
  }
}

async function runMigrationsInternal(
  db: CachinkDatabase,
  options: RunMigrationsOptions,
): Promise<void> {
  await db.run(sql.raw(CREATE_TRACKER_SQL));
  const applied = await loadAppliedTags(db);

  const pending = migrationsBundle.journal.entries.filter((e) => !applied.has(e.tag));

  if (pending.length === 0) {
    await setSchemaVersion(db, SCHEMA_VERSION);
    return;
  }

  await runBackupIfNeeded(options, pending[0]!.tag);

  for (const entry of pending) {
    const migrationSql = resolveMigrationSql(entry.tag);
    await applySingleMigration(db, entry.tag, migrationSql, options.skipTransactions === true);
  }

  await setSchemaVersion(db, SCHEMA_VERSION);
}
