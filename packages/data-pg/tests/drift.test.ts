import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { getTableConfig as pgConfig } from 'drizzle-orm/pg-core';
import { getTableConfig as sqliteConfig } from 'drizzle-orm/sqlite-core';

import * as sqliteSchema from '@xangarro/data/schema';
import { DOWN_TABLES, HYBRID_TABLES, NEVER_SYNCED_TABLES, UP_TABLES } from '@xangarro/contracts';

import * as pgSchema from '../src/schema/index.js';

/**
 * The drift test (B-02).
 *
 * The sync wire format addresses columns **by name**. If the cloud renames one
 * the device still sends, the row is not rejected — it is silently written with
 * a missing field, which is the worst failure mode this system has. Nothing but
 * a test can prevent it, because both sides compile fine independently.
 *
 * So: every table that crosses the wire must exist on both sides with exactly
 * the same column names. Types may differ — Postgres has `timestamptz` and real
 * `bigint` where SQLite has text and numeric — but never the names.
 */

type Cols = ReadonlySet<string>;

function pgTables(): ReadonlyMap<string, Cols> {
  const out = new Map<string, Cols>();
  for (const value of Object.values(pgSchema)) {
    try {
      const cfg = pgConfig(value as never);
      out.set(cfg.name, new Set(cfg.columns.map((c) => c.name)));
    } catch {
      /* not a table (helpers, column factories) */
    }
  }
  return out;
}

function sqliteTables(): ReadonlyMap<string, Cols> {
  const out = new Map<string, Cols>();
  for (const value of Object.values(sqliteSchema)) {
    try {
      const cfg = sqliteConfig(value as never);
      out.set(cfg.name, new Set(cfg.columns.map((c) => c.name)));
    } catch {
      /* not a table */
    }
  }
  return out;
}

const PG = pgTables();
const SQLITE = sqliteTables();
const SYNCED = [...UP_TABLES, ...HYBRID_TABLES, ...DOWN_TABLES];

describe('cloud ↔ device schema drift', () => {
  it('has a Postgres table for every synced table in the contract', () => {
    const missing = SYNCED.filter((t) => !PG.has(t));
    assert.deepEqual(missing, [], `no cloud table for: ${missing.join(', ')}`);
  });

  it('has a SQLite table for every synced table in the contract', () => {
    const missing = SYNCED.filter((t) => !SQLITE.has(t));
    assert.deepEqual(missing, [], `no device table for: ${missing.join(', ')}`);
  });

  for (const table of SYNCED) {
    it(`${table} has identical column names on both sides`, () => {
      const pg = PG.get(table);
      const lite = SQLITE.get(table);
      assert.ok(pg !== undefined, `${table} missing from the cloud schema`);
      assert.ok(lite !== undefined, `${table} missing from the device schema`);

      const onlyCloud = [...pg].filter((c) => !lite.has(c)).sort();
      const onlyDevice = [...lite].filter((c) => !pg.has(c)).sort();

      assert.deepEqual(onlyCloud, [], `${table}: columns only in the cloud`);
      assert.deepEqual(onlyDevice, [], `${table}: columns only on the device`);
    });
  }

  it('never mirrors a device-only table into the cloud', () => {
    // `app_config` and `director_alerts` are local to the phone by decision.
    const leaked = NEVER_SYNCED_TABLES.filter((t) => PG.has(t));
    assert.deepEqual(leaked, [], `these must not exist in Postgres: ${leaked.join(', ')}`);
  });

  it('keeps every portal-only table out of the sync contract', () => {
    const synced = new Set<string>([...SYNCED, ...NEVER_SYNCED_TABLES]);
    const portalOnly = [...PG.keys()].filter((t) => !synced.has(t));
    // These are the ADR-060 portal-only entities. Adding one to `scope.ts`
    // promotes it to a synced entity and the full §11 checklist applies.
    assert.deepEqual(portalOnly.sort(), [
      'activation_codes',
      'business_members',
      'devices',
      'metas',
      'notices',
      'sync_log',
      'sync_rejections',
    ]);
  });
});
