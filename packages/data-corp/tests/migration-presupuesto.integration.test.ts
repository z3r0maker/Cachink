import assert from 'node:assert/strict';
import type postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import { integrationSuite } from '@xangarro/testing/integration';

import { crearBaseDesechable, type BaseDesechable } from './base-desechable';

/**
 * 0014 (E-22), old → new (CLAUDE.md §2.9): the migration only adds tables,
 * so a ledger from before keeps every entry, and the new tables start empty
 * with their rules in force. Run on a throwaway database migrated up to 0013.
 */
const { describe } = integrationSuite();

describe('0014: a ledger from before gains an empty budget', () => {
  let base: BaseDesechable;
  let sql: postgres.Sql;

  beforeAll(async () => {
    base = await crearBaseDesechable();
    sql = base.sql;
    await base.aplicar((f) => f < '0014');
    await sql`INSERT INTO corp.closed_periods (period, closed_by, closed_at)
              VALUES ('2026-08', 'f1', now())`;
    await base.aplicar((f) => f >= '0014');
  });

  afterAll(() => base?.cerrar());

  it('keeps what was there, and the new tables start empty', async () => {
    const [cerrado] = await sql`SELECT count(*)::int AS n FROM corp.closed_periods`;
    assert.equal(cerrado?.n, 1);
    for (const t of ['budgets', 'budget_lines', 'budget_answers', 'spend_requests']) {
      const [r] = await sql`SELECT count(*)::int AS n FROM ${sql('corp')}.${sql(t)}`;
      assert.equal(r?.n, 0, t);
    }
  });

  it('holds the two-founder rule from the first budget on', async () => {
    await sql`INSERT INTO corp.budgets (id, quarter, prepared_by, prepared_at)
              VALUES ('b1', '2026-T4', 'f1', now())`;
    await assert.rejects(
      sql`INSERT INTO corp.budget_answers (budget_id, kind, founder_id, at)
          VALUES ('b1', 'aprobado', 'f1', now())`,
      /other founder/,
    );
    await assert.rejects(
      sql`INSERT INTO corp.budgets (id, quarter, prepared_by, prepared_at)
          VALUES ('b2', '2026-T4', 'f2', now())`,
      /already has a budget/,
    );
  });
});
