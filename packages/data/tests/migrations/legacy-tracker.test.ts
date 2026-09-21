/**
 * Runner upgrade from the pre-rebrand bookkeeping table (ADR-056).
 *
 * Installs migrated before 0004 recorded applied tags in
 * `__cachink_migrations`. If the runner only looked at the new tracker it
 * would see zero applied tags, re-run 0000 against an existing schema and
 * crash on boot.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { describe, expect, it } from 'vitest';
import * as schema from '../../src/schema/index.js';
import type { XangarroDatabase } from '../../src/repositories/drizzle/_db.js';
import { migrationSqlByTag } from '../../drizzle/migrations/index.js';
import { runMigrations } from '../../src/migrator/run-migrations.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

/** What a pre-merge install had applied under the old tracker. */
const LEGACY_APPLIED = [
  '0000_initial',
  '0001_add_business_fiscal',
  '0002_add_business_regimen_sat',
  '0003_mensajes_respuestas_operador',
  '0004_c18_receivables_expected_cash',
  '0005_c17_tickets_sales_lines',
];
const NOW = '2026-09-16T12:00:00.000Z';

function oldRunnerInstall(): { sqlite: Database.Database; db: XangarroDatabase } {
  const sqlite = new Database(':memory:');
  for (const tag of LEGACY_APPLIED) {
    for (const stmt of splitStatements(migrationSqlByTag[tag] ?? '')) sqlite.exec(stmt);
  }
  sqlite.exec(
    'CREATE TABLE __cachink_migrations (tag TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)',
  );
  const insert = sqlite.prepare('INSERT INTO __cachink_migrations (tag, applied_at) VALUES (?, ?)');
  for (const tag of LEGACY_APPLIED) insert.run(tag, NOW);
  sqlite.pragma('user_version = 6');
  return { sqlite, db: drizzle(sqlite, { schema }) as unknown as XangarroDatabase };
}

function tags(sqlite: Database.Database, table: string): string[] {
  return (sqlite.prepare(`SELECT tag FROM ${table} ORDER BY tag`).all() as { tag: string }[]).map(
    (r) => r.tag,
  );
}

function hasTable(sqlite: Database.Database, name: string): boolean {
  return (
    sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) !==
    undefined
  );
}

describe('runMigrations — legacy __cachink_migrations tracker', () => {
  it('adopts the old tracker, applies only the merge migrations and keeps sync state', async () => {
    const { sqlite, db } = oldRunnerInstall();
    await runMigrations(db);

    expect(hasTable(sqlite, '__cachink_migrations')).toBe(false);
    expect(tags(sqlite, '__xangarro_migrations')).toEqual([
      ...LEGACY_APPLIED,
      '0006_capture_client',
      '0007_operator_only',
      '0008_stock_baseline',
      '0009_xangarro_sync_tables',
      '0010_expenses_empleado',
    ]);
  });

  it('is idempotent on the second launch after the upgrade', async () => {
    const { sqlite, db } = oldRunnerInstall();
    await runMigrations(db);
    await runMigrations(db);
    expect(tags(sqlite, '__xangarro_migrations')).toHaveLength(LEGACY_APPLIED.length + 5);
  });

  it('does not create or rename a legacy tracker on a fresh install', async () => {
    const sqlite = new Database(':memory:');
    await runMigrations(drizzle(sqlite, { schema }) as unknown as XangarroDatabase);
    expect(hasTable(sqlite, '__cachink_migrations')).toBe(false);
    expect(tags(sqlite, '__xangarro_migrations')).toContain('0010_expenses_empleado');
  });

  it('prefers the new tracker when both exist and leaves the stale legacy table alone', async () => {
    const { sqlite, db } = oldRunnerInstall();
    await runMigrations(db);
    sqlite.exec(
      'CREATE TABLE __cachink_migrations (tag TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)',
    );

    await expect(runMigrations(db)).resolves.toBeUndefined();
    expect(tags(sqlite, '__cachink_migrations')).toEqual([]);
    expect(tags(sqlite, '__xangarro_migrations')).toHaveLength(LEGACY_APPLIED.length + 5);
  });

  it('fails loudly when the legacy tracker is unreadable instead of re-running 0000', async () => {
    const { sqlite, db } = oldRunnerInstall();
    sqlite.exec('DROP TABLE __cachink_migrations');
    sqlite.exec('CREATE TABLE __cachink_migrations (other TEXT)');

    await expect(runMigrations(db)).rejects.toThrow();
  });
});
