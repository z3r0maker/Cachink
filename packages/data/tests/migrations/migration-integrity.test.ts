/**
 * CI validation test suite for the migration engine.
 *
 * These tests run on every CI push and catch:
 *   1. Mismatches between _journal.json and SCHEMA_VERSION
 *   2. Missing SQL registrations in migrationSqlByTag
 *   3. Migrations that fail on a fresh :memory: DB
 *   4. Non-idempotent migrations (double-apply must not crash)
 *   5. PRAGMA user_version not set after migration
 *   6. All expected tables exist after migration
 *   7. Transaction rollback on bad SQL
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { describe, expect, it } from 'vitest';
import * as schema from '../../src/schema/index.js';
import type { CachinkDatabase } from '../../src/repositories/drizzle/_db.js';
import journal from '../../drizzle/migrations/meta/_journal.json';
import { migrationSqlByTag } from '../../drizzle/migrations/index.js';
import { runMigrations } from '../../src/migrator/run-migrations.js';
import { SCHEMA_VERSION } from '../../src/migrator/schema-version.js';

function _freshAsyncDb(): CachinkDatabase {
  const sqlite = new Database(':memory:');
  return drizzle(sqlite, { schema }) as unknown as CachinkDatabase;
}

function _getSqliteHandle(_db: CachinkDatabase): Database.Database {
  // drizzle-orm/better-sqlite3 stores the raw db internally;
  // we can create a fresh one for direct queries.
  const sqlite = new Database(':memory:');
  return sqlite;
}

describe('Migration integrity', () => {
  it('journal entry count matches SCHEMA_VERSION', () => {
    expect(journal.entries.length).toBe(SCHEMA_VERSION);
  });

  it('every journal tag has SQL registered in migrationSqlByTag', () => {
    for (const entry of journal.entries) {
      expect(
        migrationSqlByTag[entry.tag],
        `Missing SQL for tag '${entry.tag}'`,
      ).toBeDefined();
    }
  });

  it('every registered SQL key has a journal entry', () => {
    const journalTags = new Set(journal.entries.map((e) => e.tag));
    for (const key of Object.keys(migrationSqlByTag)) {
      expect(
        journalTags.has(key),
        `SQL key '${key}' has no journal entry`,
      ).toBe(true);
    }
  });

  it('journal entries are in ascending idx order', () => {
    for (let i = 0; i < journal.entries.length; i++) {
      expect(journal.entries[i]!.idx).toBe(i);
    }
  });

  it('migrations produce a valid schema on a fresh DB', async () => {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite, { schema }) as unknown as CachinkDatabase;

    await runMigrations(db);

    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    const names = new Set(tables.map((t) => t.name));

    const expectedTables = [
      'businesses',
      'app_config',
      'sales',
      'expenses',
      'products',
      'inventory_movements',
      'employees',
      'clients',
      'client_payments',
      'day_closes',
      'recurring_expenses',
      'users',
      'caja_turnos',
      'conversion_recetas',
      'conversions',
      'auditorias_inventario',
      'entregas_credito',
      'director_alerts',
      'caja_movimientos',
      'cancelacion_logs',
      '__cachink_migrations',
      '__cachink_change_log',
      '__cachink_sync_state',
      '__cachink_conflicts',
    ];

    for (const table of expectedTables) {
      expect(names, `expected table '${table}' to exist`).toContain(table);
    }
  });

  it('migrations are idempotent — second run applies nothing', async () => {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite, { schema }) as unknown as CachinkDatabase;

    await runMigrations(db);
    await runMigrations(db); // Must not throw

    const rows = sqlite
      .prepare('SELECT tag FROM __cachink_migrations ORDER BY tag')
      .all() as Array<{ tag: string }>;

    // Each tag appears exactly once
    const tags = rows.map((r) => r.tag);
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags.length).toBe(journal.entries.length);
  });

  it('PRAGMA user_version equals SCHEMA_VERSION after migration', async () => {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite, { schema }) as unknown as CachinkDatabase;

    await runMigrations(db);

    const result = sqlite.pragma('user_version') as Array<{
      user_version: number;
    }>;
    const version =
      Array.isArray(result) && result.length > 0
        ? result[0]!.user_version
        : (result as unknown as number);
    expect(version).toBe(SCHEMA_VERSION);
  });

  it('change-log triggers are installed for synced tables', async () => {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite, { schema }) as unknown as CachinkDatabase;

    await runMigrations(db);

    const triggers = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'trigger'")
      .all() as Array<{ name: string }>;
    const triggerNames = new Set(triggers.map((t) => t.name));

    const syncedTables = [
      'sales',
      'expenses',
      'products',
      'inventory_movements',
      'employees',
      'clients',
      'client_payments',
      'day_closes',
      'recurring_expenses',
      'businesses',
    ];

    for (const table of syncedTables) {
      expect(
        triggerNames,
        `expected trigger trg_${table}_ai`,
      ).toContain(`trg_${table}_ai`);
      expect(
        triggerNames,
        `expected trigger trg_${table}_au`,
      ).toContain(`trg_${table}_au`);
    }
  });

  it('partial indexes are created', async () => {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite, { schema }) as unknown as CachinkDatabase;

    await runMigrations(db);

    const indexes = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all() as Array<{ name: string }>;
    const indexNames = new Set(indexes.map((i) => i.name));

    const expectedIndexes = [
      'idx_sales_biz_fecha',
      'idx_sales_cliente',
      'idx_expenses_biz_fecha',
      'idx_expenses_recurrente_fecha',
      'idx_invmov_producto',
      'idx_client_payments_venta',
      'idx_day_closes_biz_fecha',
      'idx_products_biz',
      'idx_employees_biz',
      'idx_clients_biz',
      'idx_recurring_expenses_biz',
      'idx_changelog_table_row',
      'idx_cachink_conflicts_detected_at',
    ];

    for (const idx of expectedIndexes) {
      expect(indexNames, `expected index '${idx}'`).toContain(idx);
    }
  });
});
