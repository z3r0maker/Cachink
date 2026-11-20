import assert from 'node:assert/strict';
import type postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import { integrationSuite } from '@xangarro/testing/integration';

import { crearBaseDesechable, type BaseDesechable } from './base-desechable';

/**
 * 0016 (E-20), old → new (CLAUDE.md §2.9): the migration only adds tables,
 * so a ledger and a code list from before stay as they were, and the Tablero
 * starts empty with its rules in force. Run on a throwaway database migrated
 * up to 0015.
 */
const { describe } = integrationSuite();

const TABLAS = [
  'board_plan_events',
  'board_objectives',
  'board_objective_progress',
  'board_cards',
  'board_card_events',
  'board_clauses',
  'board_notices',
];

describe('0016: a ledger from before gains an empty Tablero', () => {
  let base: BaseDesechable;
  let sql: postgres.Sql;

  beforeAll(async () => {
    base = await crearBaseDesechable();
    sql = base.sql;
    await base.aplicar((f) => f < '0016');
    await sql`INSERT INTO corp.closed_periods (period, closed_by, closed_at)
              VALUES ('2026-08', 'f1', now())`;
    await sql`INSERT INTO corp.account_code_lists (id, captured_by, captured_at)
              VALUES ('l1', 'f1', now())`;
    await base.aplicar((f) => f >= '0016');
  });

  afterAll(() => base?.cerrar());

  it('keeps what was there, and the new tables start empty', async () => {
    const [cerrado] = await sql`SELECT count(*)::int AS n FROM corp.closed_periods`;
    assert.equal(cerrado?.n, 1);
    const [lista] = await sql`SELECT count(*)::int AS n FROM corp.account_code_lists`;
    assert.equal(lista?.n, 1);
    for (const t of TABLAS) {
      const [r] = await sql`SELECT count(*)::int AS n FROM ${sql('corp')}.${sql(t)}`;
      assert.equal(r?.n, 0, t);
    }
  });

  it("holds a card's rules from the first card on", async () => {
    await sql`INSERT INTO corp.board_cards (id, quarter, kind, title, criterion, owner, due,
                value_f1, created_by, created_at, updated_by, updated_at)
              VALUES ('c1', '2026-T4', 'entregable', 'Lanzamiento', 'En App Store.', 1,
                '2026-12-15', 4000000, 'f1', now(), 'f1', now())`;
    await assert.rejects(
      sql`INSERT INTO corp.board_cards (id, quarter, kind, title, criterion, owner, due,
            value_f1, created_by, created_at, updated_by, updated_at)
          VALUES ('c2', '2026-T4', 'tarea', 'Banco', '', 1, '2026-12-15', 100, 'f1', now(), 'f1', now())`,
      /board_cards_task_check/,
    );
    await sql`INSERT INTO corp.board_card_events (id, card_id, kind, socio, on_date, founder_id, at)
              VALUES ('e1', 'c1', 'iniciada', 1, '2026-10-05', 'f1', now())`;
    await assert.rejects(
      sql`UPDATE corp.board_cards SET value_f2 = 1 WHERE id = 'c1'`,
      /value frozen/,
    );
    await sql`UPDATE corp.board_cards SET dropped_in = '2027-T1' WHERE id = 'c1'`;
    await assert.rejects(
      sql`UPDATE corp.board_cards SET dropped_in = '2027-T2' WHERE id = 'c1'`,
      /already left a plan/,
    );
  });
});
