/**
 * «Desvincular y borrar» (MvDesvincularBorrar): every table a device keeps
 * is emptied, on the real migrated schema, and the schema itself survives so
 * the app can link again without migrating from scratch.
 */

import { sql, type SQL } from 'drizzle-orm';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import { describe, expect, it, vi } from 'vitest';
import { makeFreshDb } from './helpers/fresh-db';
import type { XangarroDatabase } from '../src/repositories/drizzle/_db.js';
import { readStringColumn, type RawRow } from '../src/migrator/raw-row.js';
import { LocalWipeError, wipeLocalData } from '../src/wipe-local-data.js';

async function tables(db: XangarroDatabase): Promise<string[]> {
  const rows = (await db.all(
    sql.raw(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`),
  )) as RawRow[];
  return rows.map((r) => readStringColumn(r, 'name') ?? '').filter(Boolean);
}

async function count(db: XangarroDatabase, table: string): Promise<number> {
  const rows = (await db.all(sql.raw(`SELECT count(*) AS n FROM "${table}"`))) as RawRow[];
  const row = rows[0];
  if (!row) return 0;
  return Number(Array.isArray(row) ? row[0] : (row as Record<string, unknown>).n);
}

async function seed(db: XangarroDatabase): Promise<void> {
  await db.run(sql.raw(`INSERT INTO app_config (key, value) VALUES ('activation', '{"x":1}')`));
  await db.run(
    sql.raw(`INSERT INTO __xangarro_sync_state (scope, value) VALUES ('cursor', '"9"')`),
  );
  await db.run(
    sql.raw(
      `INSERT INTO __xangarro_change_log (table_name, row_id, row_updated_at, row_device_id, op)
       VALUES ('sales', 'S1', '2026-11-03T10:00:00Z', 'D', 'insert')`,
    ),
  );
  await db.run(
    sql.raw(
      `INSERT INTO __sync_row_status (table_name, row_id, status) VALUES ('sales', 'S1', 'pending')`,
    ),
  );
}

describe('wipeLocalData', () => {
  it('empties every table, sync bookkeeping included', async () => {
    const db = makeFreshDb();
    await seed(db);
    const wiped = await wipeLocalData(db);
    expect(wiped.tables).toBeGreaterThan(10);
    expect(wiped.compacted).toBe(true);
    for (const t of await tables(db)) {
      if (t.endsWith('_migrations')) continue;
      expect([t, await count(db, t)]).toEqual([t, 0]);
    }
  });

  it('keeps the schema and the migration record, so linking again needs no migration', async () => {
    const db = makeFreshDb();
    const before = await tables(db);
    const applied = await count(db, '__cachink_migrations');
    await wipeLocalData(db);
    expect(await tables(db)).toEqual(before);
    expect(await count(db, '__cachink_migrations')).toBe(applied);
  });

  it('is idempotent: a second wipe on an empty device succeeds', async () => {
    const db = makeFreshDb();
    await wipeLocalData(db);
    expect((await wipeLocalData(db)).tables).toBeGreaterThan(10);
  });

  it('leaves foreign keys on, as the providers open the database', async () => {
    const db = makeFreshDb();
    await db.run(sql.raw('PRAGMA foreign_keys = ON'));
    await wipeLocalData(db);
    const rows = (await db.all(sql.raw('PRAGMA foreign_keys'))) as RawRow[];
    const row = rows[0] as Record<string, unknown> | unknown[];
    expect(Number(Array.isArray(row) ? row[0] : row.foreign_keys)).toBe(1);
  });

  it('wraps a driver failure in a typed error', async () => {
    const broken = {
      all: () => Promise.reject(new Error('disk I/O error')),
      run: () => Promise.reject(new Error('disk I/O error')),
    } as unknown as XangarroDatabase;
    const error = await wipeLocalData(broken).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LocalWipeError);
    expect((error as LocalWipeError).code).toBe('LOCAL_WIPE_FAILED');
    expect((error as LocalWipeError).message).toContain('disk I/O error');
  });

  it('a compaction the driver refuses does not fail a wipe that already emptied the rows', async () => {
    const db = makeFreshDb();
    await seed(db);
    const dialect = new SQLiteSyncDialect();
    const run = db.run.bind(db);
    vi.spyOn(db, 'run').mockImplementation(((q: SQL) =>
      dialect.sqlToQuery(q).sql === 'VACUUM'
        ? Promise.reject(new Error('cannot VACUUM - SQL statements in progress'))
        : run(q)) as typeof db.run);
    expect((await wipeLocalData(db)).compacted).toBe(false);
    expect(await count(db, 'app_config')).toBe(0);
  });
});
