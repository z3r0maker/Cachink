import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import { REGIMEN_FISCAL, regimenFromLegacy } from '@xangarro/domain';

import { integrationSuite } from './support/db';

/**
 * Old → new for `0013_business_regimen_sat.sql` (CLAUDE.md §2.9): the SQL
 * backfill must say exactly what the domain's `regimenFromLegacy` says, for
 * every legacy name and every SAT code. The real file, on a temp copy.
 */
const MIGRATION = join(import.meta.dirname, '../drizzle/0013_business_regimen_sat.sql');
const { url, describe } = integrationSuite();

describe('migration: regimen_sat backfill', () => {
  let sql: postgres.Sql;
  beforeAll(() => {
    sql = postgres(url as string, { max: 1, onnotice: () => undefined });
  });
  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  it('maps every stored régimen as the domain does, and never guesses «Otro»', async () => {
    const values = [
      'RESICO',
      'RIF',
      'Asalariados',
      'Otro',
      'algo raro',
      ...Object.keys(REGIMEN_FISCAL),
    ];
    await sql.begin(async (tx) => {
      await tx`SET LOCAL search_path = pg_temp, public`;
      await tx`CREATE TEMP TABLE businesses (id text PRIMARY KEY, regimen_fiscal text NOT NULL) ON COMMIT DROP`;
      for (const [i, v] of values.entries())
        await tx`INSERT INTO businesses VALUES (${`B${i}`}, ${v})`;

      await tx.unsafe(readFileSync(MIGRATION, 'utf8'));

      const rows = await tx<{ r: string; s: string | null }[]>`
        SELECT regimen_fiscal AS r, regimen_sat AS s FROM businesses`;
      assert.equal(rows.length, values.length);
      for (const row of rows) assert.equal(row.s, regimenFromLegacy(row.r), `«${row.r}»`);
    });
  });
});
