import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';

/**
 * Old → new data for `0002_sync_cursor.sql` (CLAUDE.md §2.9).
 *
 * The migration turns a global identity into per-tenant seqs. What must hold
 * for rows written before it: every seq is **kept** (a device holding a cursor
 * still holds a valid one), each tenant's counter starts at its own highest seq
 * (so the next seq is above everything it already has), and two tenants may
 * now share a seq value.
 *
 * As in the users.active test, the real file runs against pre-migration temp
 * copies: `pg_temp` is first on the search path, so the migration's
 * unqualified statements land on them.
 */
const MIGRATION = join(import.meta.dirname, '../drizzle/0002_sync_cursor.sql');
const { url, describe } = integrationSuite();

describe('migration: per-tenant sync cursor', () => {
  let sql: postgres.Sql;

  beforeAll(() => {
    sql = postgres(url as string, { max: 1, onnotice: () => undefined });
  });

  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  it('keeps every seq, starts each counter at its tenant maximum, and scopes seqs by tenant', async () => {
    await sql.begin(async (tx) => {
      await tx`SET LOCAL search_path = pg_temp, public`;
      await tx`CREATE TEMP TABLE sync_log (
        seq integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        table_name text NOT NULL, row_id text NOT NULL, op text NOT NULL,
        business_id text NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
      ) ON COMMIT DROP`;
      await tx`CREATE INDEX sync_log_business_seq_idx ON sync_log (business_id, seq)`;
      await tx`CREATE TEMP TABLE devices (id text PRIMARY KEY) ON COMMIT DROP`;
      await tx`CREATE TEMP TABLE sync_rejections (
        id text PRIMARY KEY, business_id text NOT NULL, device_id text NOT NULL,
        table_name text NOT NULL, row_id text NOT NULL, resolved_at timestamptz
      ) ON COMMIT DROP`;
      await tx`INSERT INTO devices (id) VALUES ('dev-1')`;
      // Interleaved tenants, as a global identity leaves them.
      for (const biz of ['A', 'B', 'A', 'A', 'B']) {
        await tx`INSERT INTO sync_log (table_name, row_id, op, business_id, created_at, updated_at)
                 VALUES ('products', 'p', 'update', ${biz}, now(), now())`;
      }

      await tx.unsafe(readFileSync(MIGRATION, 'utf8'));

      const seqs = await tx<{ business_id: string; seq: string }[]>`
        SELECT business_id, seq::text FROM sync_log ORDER BY seq`;
      assert.deepEqual(
        seqs.map((r) => `${r.business_id}${r.seq}`),
        ['A1', 'B2', 'A3', 'A4', 'B5'],
        'existing seqs are kept, not renumbered',
      );

      const cursors = await tx<{ business_id: string; last_seq: string }[]>`
        SELECT business_id, last_seq::text FROM sync_cursors ORDER BY business_id`;
      assert.deepEqual(
        cursors.map((r) => [r.business_id, r.last_seq]),
        [
          ['A', '4'],
          ['B', '5'],
        ],
      );

      // Per-tenant PK: tenant B may now write seq 4 — A's 4 does not collide.
      await tx`INSERT INTO sync_log (seq, table_name, row_id, op, business_id, created_at, updated_at)
               VALUES (4, 'users', 'u', 'insert', 'B', now(), now())`;

      const [dev] = await tx<{ acknowledged_through: string }[]>`
        SELECT acknowledged_through::text FROM devices WHERE id = 'dev-1'`;
      assert.equal(dev?.acknowledged_through, '0', 'existing devices start unacknowledged');
    });
  });
});
