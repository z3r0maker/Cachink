import { afterAll, beforeAll, it } from 'vitest';
import assert from 'node:assert/strict';
import postgres from 'postgres';

import { integrationSuite } from './support/db';

/**
 * The database half of DB-IDX-01: the audit asked for a check that queries
 * `pg_index` and fails if an RLS-enabled table lacks an index whose first
 * column is `business_id`.
 *
 * `tenant-indexes.test.ts` proves the schema declares them; this proves the
 * migrations actually created them, which is what the planner reads. A table
 * can be right in Drizzle and absent from the database if someone adds the
 * index definition and forgets the SQL file.
 */
const { url, describe } = integrationSuite();

describe('tenant indexes in the database (DB-IDX-01)', () => {
  let sql: postgres.Sql;

  beforeAll(() => {
    sql = postgres(url, { prepare: false });
  });

  afterAll(async () => {
    await sql.end();
  });

  it('every RLS table keyed by business_id has an index leading with it', async () => {
    const rows = await sql<{ relname: string }[]>`
      WITH rls AS (
        SELECT c.oid, c.relname
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
      ),
      keyed AS (
        SELECT r.oid, r.relname
          FROM rls r
          JOIN pg_attribute a ON a.attrelid = r.oid AND a.attname = 'business_id' AND a.attnum > 0
      ),
      lead_cols AS (
        SELECT i.indrelid
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
         WHERE a.attname = 'business_id'
      )
      SELECT k.relname
        FROM keyed k
       WHERE NOT EXISTS (SELECT 1 FROM lead_cols l WHERE l.indrelid = k.oid)
       ORDER BY k.relname`;

    assert.deepEqual(
      rows.map((r) => r.relname),
      [],
      'these tables are scanned in full behind RLS — add a business_id-leading index',
    );
  });

  it('the indexes the audit measured are the ones that exist', async () => {
    const rows = await sql<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
       WHERE schemaname = 'public' AND indexname IN (
         'sales_business_idx', 'expenses_business_idx', 'inventory_movements_business_idx',
         'products_business_idx', 'day_closes_business_idx', 'devices_business_idx',
         'activation_codes_business_idx', 'business_members_business_idx'
       )
       ORDER BY indexname`;
    assert.equal(rows.length, 8, `expected the §2.2 set, got ${rows.map((r) => r.indexname)}`);
  });
});
