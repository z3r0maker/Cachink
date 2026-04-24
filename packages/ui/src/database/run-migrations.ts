/**
 * Driver-agnostic migration runner (P1C-M2-T02).
 *
 * Executes the SQL from `@cachink/data/migrations` on any Drizzle-wrapped
 * SQLite connection — expo-sqlite (mobile), Tauri sqlite-proxy (desktop),
 * or better-sqlite3 (tests). Tracks applied migrations in a bookkeeping
 * table `__cachink_migrations` so re-runs are idempotent.
 *
 * Design notes:
 *   - We don't use Drizzle's first-party migrator because its bundle
 *     format differs per driver (expo vs better-sqlite3 vs sqlite-proxy).
 *     A single raw SQL executor works identically everywhere.
 *   - Statements are split on the `--> statement-breakpoint` marker that
 *     Drizzle Kit emits between DDL statements. Single execution per
 *     statement keeps error messages specific and compatible with SQLite
 *     drivers that don't allow multiple statements per prepare.
 *   - Tag recording uses inlined values rather than bound parameters
 *     because `sql.raw` is the only universal escape hatch across the
 *     three drivers — safe here because tags come from the committed
 *     journal, never user input.
 */

import { sql } from 'drizzle-orm';
import type { CachinkDatabase } from '@cachink/data';
import migrationsBundle, { migrationSqlByTag } from '@cachink/data/migrations';

const MIGRATIONS_TABLE = '__cachink_migrations';

const CREATE_TRACKER_SQL = `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
  tag TEXT PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL
)`;

const STATEMENT_BREAKPOINT = /^-->\s*statement-breakpoint\s*$/m;

interface MigrationRow {
  readonly tag: string;
}

/** Read applied-migration tags. Returns an empty set on a fresh database. */
async function loadAppliedTags(db: CachinkDatabase): Promise<ReadonlySet<string>> {
  const rows = (await db.all(sql.raw(`SELECT tag FROM ${MIGRATIONS_TABLE}`))) as MigrationRow[];
  return new Set(rows.map((r) => r.tag));
}

/** Split a migration's SQL at the Drizzle Kit statement-breakpoint marker. */
export function splitStatements(raw: string): readonly string[] {
  return raw
    .split(STATEMENT_BREAKPOINT)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Apply any pending migrations in journal order. Safe to call on every app
 * launch — the bookkeeping table skips already-applied migrations.
 */
export async function runMigrations(db: CachinkDatabase): Promise<void> {
  await db.run(sql.raw(CREATE_TRACKER_SQL));
  const applied = await loadAppliedTags(db);

  for (const entry of migrationsBundle.journal.entries) {
    if (applied.has(entry.tag)) continue;
    const raw = migrationSqlByTag[entry.tag];
    if (!raw) {
      throw new Error(
        `Migration '${entry.tag}' is listed in the journal but missing from migrationSqlByTag. ` +
          `Did you forget to register its SQL in @cachink/data/drizzle/migrations/index.ts?`,
      );
    }

    for (const statement of splitStatements(raw)) {
      await db.run(sql.raw(statement));
    }

    const appliedAt = new Date().toISOString();
    await db.run(
      sql.raw(
        `INSERT INTO ${MIGRATIONS_TABLE} (tag, applied_at) VALUES ('${entry.tag}', '${appliedAt}')`,
      ),
    );
  }
}
