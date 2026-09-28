/**
 * Every tenant table carries a `business_id`-leading index (DB-IDX-01).
 *
 * RLS filters by `business_id`, so without such an index each query scans
 * every tenant's rows and throws away the ones that are not ours. The audit
 * measured 24–169 ms before and 0.02–3.9 ms after at 200 tenants, and seq-scan
 * time grows with the table's **total** rows, not the tenant's — the cost is
 * paid by whoever is largest, and ADR-068 projects ~36 M rows a year.
 *
 * This is the static half of the audit's recommendation (a `pg_index` query in
 * CI): the schema is the source of truth for drizzle-kit, so a table added
 * without its index fails here without needing a database.
 */

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { getTableColumns, getTableName, is, sql } from 'drizzle-orm';
import { getTableConfig, index, PgTable, pgTable, text } from 'drizzle-orm/pg-core';
import * as schema from '../src/schema/index.js';

interface TenantTable {
  readonly name: string;
  readonly leading: readonly string[];
}

/**
 * Tables that carry `business_id` but are not tenant-scoped reads: their
 * access path is another key entirely. Each says why; an entry that stops
 * being true costs one seq scan, so keep the list short. Empty today.
 */
const NOT_TENANT_SCOPED: ReadonlySet<string> = new Set<string>([]);

/**
 * The first column of every index, primary key and unique constraint. A
 * composite PK leading with `business_id` is backed by an index in Postgres
 * and serves the tenant filter exactly as a declared index would — and so
 * does a single-column one (`business_id` as the whole key, one row per
 * tenant), which drizzle keeps on the column rather than in `primaryKeys`.
 * DB2-IDX-01 dropped the plain `business_id` indexes that only repeated one.
 * A partial index does not count.
 */
function leadingColumns(
  config: ReturnType<typeof getTableConfig>,
  columns: readonly {
    readonly name: string;
    readonly primary: boolean;
    readonly isUnique: boolean;
  }[],
): string[] {
  const first = (cols: readonly { readonly name?: string }[]): string[] =>
    cols[0]?.name ? [cols[0].name] : [];
  return [
    // A partial index serves only queries implying its predicate: not a
    // tenant index on its own (DB3-IDX-01).
    ...config.indexes
      .filter((i) => i.config.where === undefined)
      .flatMap((i) => first(i.config.columns as { name?: string }[])),
    ...(config.primaryKeys ?? []).flatMap((k) => first(k.columns)),
    ...(config.uniqueConstraints ?? []).flatMap((u) => first(u.columns)),
    ...columns.filter((c) => c.primary || c.isUnique).map((c) => c.name),
  ];
}

function tenantTables(): TenantTable[] {
  const out: TenantTable[] = [];
  for (const value of Object.values(schema)) {
    if (!is(value, PgTable)) continue;
    const columns = Object.values(getTableColumns(value)).map((c) => c.name);
    if (!columns.includes('business_id')) continue;
    const name = getTableName(value);
    if (NOT_TENANT_SCOPED.has(name)) continue;
    const config = getTableConfig(value);
    out.push({
      name,
      leading: leadingColumns(config, Object.values(getTableColumns(value))),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

describe('tenant indexes (DB-IDX-01)', () => {
  it('every tenant table has an index leading with business_id', () => {
    const missing = tenantTables()
      .filter((t) => !t.leading.includes('business_id'))
      .map((t) => t.name);
    assert.deepEqual(
      missing,
      [],
      `these tables are scanned in full on every tenant query — add a business_id-leading index: ${missing.join(', ')}`,
    );
  });

  it('covers the tables the audit measured', () => {
    // The set §2.2 measured: if one of these ever loses its index the test
    // above still passes on a weaker one, so name them.
    const byName = new Map(tenantTables().map((t) => [t.name, t]));
    for (const name of [
      'sync_log',
      'sales',
      'expenses',
      'inventory_movements',
      'products',
      'day_closes',
      'devices',
      'activation_codes',
      'business_members',
    ]) {
      const table = byName.get(name);
      assert.ok(table, `${name} is not a tenant table any more — update this list`);
      assert.ok(
        table.leading.includes('business_id'),
        `${name} lost its business_id-leading index`,
      );
    }
  });

  it('a business_id primary key counts, so its duplicate index could go (DB2-IDX-01)', () => {
    // These lost their plain business_id index in 0045; the key must still
    // satisfy the guard, or the drop quietly made them seq-scan targets.
    const byName = new Map(tenantTables().map((t) => [t.name, t]));
    for (const name of [
      'sync_cursors',
      'billing_customers',
      'business_logos',
      'business_onboarding',
      'sync_receipts',
      'notice_preferences',
      'usage_counters',
    ]) {
      const table = byName.get(name);
      assert.ok(table, `${name} is not a tenant table any more — update this list`);
      assert.ok(table.leading.includes('business_id'), `${name}: no business_id-leading key`);
    }
  });

  it('a partial index does not count: it serves only queries that imply its predicate', () => {
    // DB3-IDX-01 dropped sales/expenses (business_id, fecha) because every
    // date range says deleted_at IS NULL; the live partial index serves those,
    // but a tenant query without the predicate would still scan the table.
    const partial = pgTable(
      'partial_only',
      {
        id: text('id').primaryKey(),
        businessId: text('business_id'),
        deletedAt: text('deleted_at'),
      },
      (t) => [
        index('partial_only_live_idx')
          .on(t.businessId)
          .where(sql`deleted_at IS NULL`),
      ],
    );
    assert.ok(
      !leadingColumns(getTableConfig(partial), Object.values(getTableColumns(partial))).includes(
        'business_id',
      ),
    );
    const byName = new Map(tenantTables().map((t) => [t.name, t]));
    for (const name of ['sales', 'expenses', 'tickets', 'business_members']) {
      assert.ok(byName.get(name)?.leading.includes('business_id'), `${name}: no full index left`);
    }
  });

  it('a table keyed by something else is still caught', () => {
    const lone = pgTable('lone', { id: text('id').primaryKey(), businessId: text('business_id') });
    assert.ok(
      !leadingColumns(getTableConfig(lone), Object.values(getTableColumns(lone))).includes(
        'business_id',
      ),
    );
  });

  it('every NOT_TENANT_SCOPED entry still exists and still carries business_id', () => {
    // Self-expiring: a renamed or dropped table must not leave a silent hole.
    const carrying = new Set<string>();
    for (const value of Object.values(schema)) {
      if (!is(value, PgTable)) continue;
      const columns = Object.values(getTableColumns(value)).map((c) => c.name);
      if (columns.includes('business_id')) carrying.add(getTableName(value));
    }
    const stale = [...NOT_TENANT_SCOPED].filter((t) => !carrying.has(t));
    assert.deepEqual(stale, [], `remove these from NOT_TENANT_SCOPED: ${stale.join(', ')}`);
  });
});
