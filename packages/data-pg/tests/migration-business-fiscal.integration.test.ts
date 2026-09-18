import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';

/**
 * Old → new for `0012_business_fiscal.sql` (CLAUDE.md §2.9): an existing
 * business is untouched and gains four NULL fiscal columns it can then store.
 * The real file runs against a pre-migration temp copy (pg_temp first).
 */
const MIGRATION = join(import.meta.dirname, '../drizzle/0012_business_fiscal.sql');
const { url, describe } = integrationSuite();

describe('migration: business fiscal columns', () => {
  let sql: postgres.Sql;
  beforeAll(() => {
    sql = postgres(url as string, { max: 1, onnotice: () => undefined });
  });
  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  it('keeps the business, adds the columns as NULL, and they take values', async () => {
    await sql.begin(async (tx) => {
      await tx`SET LOCAL search_path = pg_temp, public`;
      await tx`CREATE TEMP TABLE businesses (id text PRIMARY KEY, nombre text NOT NULL, regimen_fiscal text NOT NULL) ON COMMIT DROP`;
      await tx`INSERT INTO businesses VALUES ('B1', 'Taquería Don Pedro', 'RESICO')`;

      await tx.unsafe(readFileSync(MIGRATION, 'utf8'));

      const [row] = await tx`SELECT * FROM businesses WHERE id = 'B1'`;
      assert.equal(row?.nombre, 'Taquería Don Pedro');
      for (const c of ['rfc', 'razon_social', 'codigo_postal', 'uso_cfdi']) {
        assert.ok(row !== undefined && c in row, `${c} exists`);
        assert.equal(row?.[c], null, `${c} starts NULL`);
      }
      await tx`UPDATE businesses SET rfc = 'EKU9003173C9', uso_cfdi = 'G03'`;
      const [after] = await tx`SELECT rfc, uso_cfdi FROM businesses`;
      assert.deepEqual({ ...after }, { rfc: 'EKU9003173C9', uso_cfdi: 'G03' });
    });
  });
});
