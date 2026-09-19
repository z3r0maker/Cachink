import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { getTableColumns, getTableName, is, Table } from 'drizzle-orm';
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

/**
 * Columns the cloud may carry ahead of the device. The only exception to
 * "identical names on both sides", and deliberately narrow:
 *
 *  - **DOWN tables only.** This test exists for the UP direction — a device
 *    *sending* a column the cloud renamed writes a row with a silently missing
 *    field. On a DOWN table the device never sends; a cloud-ahead column is one
 *    it receives before it can store it.
 *  - **Only columns the wire contract already carries.** `users.active` is in
 *    `UserSchema`, so `WireUserSchema` sends it today; the cloud simply could
 *    not store it until B-13.
 *  - **Self-expiring.** The test below fails the moment the device gains the
 *    column (A-17), so this list has to be emptied rather than left to rot.
 */
const CLOUD_AHEAD: Readonly<Record<string, readonly string[]>> = {
  // B-13 stores it; the device column arrives with A-17.
  users: ['active'],
};

/** SQL column name → the Drizzle property key it is read and written by. */
function propertyKeys(schema: Record<string, unknown>): ReadonlyMap<string, Map<string, string>> {
  const out = new Map<string, Map<string, string>>();
  for (const v of Object.values(schema)) {
    if (!is(v, Table)) continue;
    const byColumn = new Map<string, string>();
    for (const [key, col] of Object.entries(getTableColumns(v))) byColumn.set(col.name, key);
    out.set(getTableName(v), byColumn);
  }
  return out;
}

describe('cloud ↔ device schema drift', () => {
  /**
   * Same column names are not enough. Rows cross the wire as objects keyed by
   * the Drizzle property, so `monto_centavos` keyed `monto` on the phone and
   * `montoCentavos` in the cloud meant every pushed sale arrived with no money
   * (a null into a NOT NULL column) and every portal reader had to remap it.
   */
  it('keys every shared column by the same property name on both sides', () => {
    const pg = propertyKeys(pgSchema as Record<string, unknown>);
    const device = propertyKeys(sqliteSchema as Record<string, unknown>);
    const differ = SYNCED.flatMap((t) =>
      [...(device.get(t) ?? [])].flatMap(([column, key]) => {
        const cloud = pg.get(t)?.get(column);
        return cloud === undefined || cloud === key ? [] : [`${t}.${column}: ${key} ≠ ${cloud}`];
      }),
    );
    assert.deepEqual(differ, []);
  });

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

      const allowed = new Set(CLOUD_AHEAD[table] ?? []);
      const onlyCloud = [...pg].filter((c) => !lite.has(c) && !allowed.has(c)).sort();
      const onlyDevice = [...lite].filter((c) => !pg.has(c)).sort();

      assert.deepEqual(onlyCloud, [], `${table}: columns only in the cloud`);
      assert.deepEqual(onlyDevice, [], `${table}: columns only on the device`);
    });
  }

  it('allows cloud-ahead columns only on DOWN tables', () => {
    const down = new Set<string>(DOWN_TABLES);
    const misplaced = Object.keys(CLOUD_AHEAD).filter((t) => !down.has(t));
    assert.deepEqual(
      misplaced,
      [],
      'a cloud-only column on an UP or HYBRID table means the device can send a row missing it',
    );
  });

  it('expires each cloud-ahead exception once the device has the column', () => {
    // Self-expiring on purpose: when A-17 adds `users.active` locally this
    // fails, and the exception must be deleted rather than left to excuse the
    // next drift that happens to share its name.
    const stale = Object.entries(CLOUD_AHEAD).flatMap(([table, cols]) =>
      cols.filter((c) => SQLITE.get(table)?.has(c) === true).map((c) => `${table}.${c}`),
    );
    assert.deepEqual(
      stale,
      [],
      'these columns now exist on the device — remove them from CLOUD_AHEAD',
    );

    const phantom = Object.entries(CLOUD_AHEAD).flatMap(([table, cols]) =>
      cols.filter((c) => PG.get(table)?.has(c) !== true).map((c) => `${table}.${c}`),
    );
    assert.deepEqual(
      phantom,
      [],
      'these are listed as cloud-ahead but the cloud does not have them',
    );
  });

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
      'billing_customers',
      'business_members',
      'business_onboarding',
      'celebraciones',
      'cfdi_globals',
      'cfdi_payments',
      'devices',
      'metas',
      'notice_preferences',
      'notices',
      'stripe_events',
      'subscriptions',
      'sync_cursors',
      'sync_log',
      'sync_receipts',
      'sync_rejections',
      'usage_counters',
      'usage_notices',
    ]);
  });
});
