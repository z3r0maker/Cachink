import assert from 'node:assert/strict';
import type postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import { integrationSuite } from '@xangarro/testing/integration';

import { crearBaseDesechable, type BaseDesechable } from './base-desechable';

/**
 * 0015 (E-43), old → new (CLAUDE.md §2.9): the migration only adds tables,
 * so a ledger from before keeps every entry and every budget, and the codes
 * start empty with their rules in force. Run on a throwaway database migrated
 * up to 0014.
 */
const { describe } = integrationSuite();

describe('0015: a ledger from before gains an empty list of codes', () => {
  let base: BaseDesechable;
  let sql: postgres.Sql;

  beforeAll(async () => {
    base = await crearBaseDesechable();
    sql = base.sql;
    await base.aplicar((f) => f < '0015');
    await sql`INSERT INTO corp.closed_periods (period, closed_by, closed_at)
              VALUES ('2026-08', 'f1', now())`;
    await sql`INSERT INTO corp.budgets (id, quarter, prepared_by, prepared_at)
              VALUES ('b1', '2026-T4', 'f1', now())`;
    await base.aplicar((f) => f >= '0015');
  });

  afterAll(() => base?.cerrar());

  it('keeps what was there, and the new tables start empty', async () => {
    const [cerrado] = await sql`SELECT count(*)::int AS n FROM corp.closed_periods`;
    assert.equal(cerrado?.n, 1);
    const [budget] = await sql`SELECT count(*)::int AS n FROM corp.budgets`;
    assert.equal(budget?.n, 1);
    for (const t of ['account_code_lists', 'account_codes', 'account_code_validations']) {
      const [r] = await sql`SELECT count(*)::int AS n FROM ${sql('corp')}.${sql(t)}`;
      assert.equal(r?.n, 0, t);
    }
  });

  it('holds the code format and the newest-list rule from the first list on', async () => {
    await sql`INSERT INTO corp.account_code_lists (id, captured_by, captured_at)
              VALUES ('l1', 'f1', '2026-11-14T10:00:00Z'), ('l2', 'f1', '2026-11-15T10:00:00Z')`;
    await assert.rejects(
      sql`INSERT INTO corp.account_codes (list_id, account, code) VALUES ('l2', 'bancos', '102-01')`,
      /account_codes_code_check/,
    );
    await assert.rejects(
      sql`INSERT INTO corp.account_code_validations (id, list_id, validated_on, marked_by, marked_at)
          VALUES ('v1', 'l1', '2026-11-14', 'f1', now())`,
      /not the newest/,
    );
    await sql`INSERT INTO corp.account_code_validations (id, list_id, validated_on, marked_by, marked_at)
              VALUES ('v2', 'l2', '2026-11-14', 'f1', now())`;
    await assert.rejects(
      sql`INSERT INTO corp.account_code_validations (id, list_id, validated_on, marked_by, marked_at)
          VALUES ('v3', 'l2', '2026-11-15', 'f1', now())`,
      /unique/,
    );
  });
});
