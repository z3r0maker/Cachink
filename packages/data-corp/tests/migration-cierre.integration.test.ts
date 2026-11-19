import assert from 'node:assert/strict';
import type postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import { integrationSuite } from '@xangarro/testing/integration';

import { crearBaseDesechable, type BaseDesechable } from './base-desechable';

/**
 * 0013 (E-14), old → new (CLAUDE.md §2.9): a month locked before Cierre del
 * mes existed has no events. It stays locked, nothing lifts it directly, and
 * it reopens the new way: one founder asks, the other approves. Run on a
 * throwaway database migrated up to 0012.
 */
const { describe } = integrationSuite();

describe('0013: a lock from before keeps its rules', () => {
  let base: BaseDesechable;
  let sql: postgres.Sql;

  beforeAll(async () => {
    base = await crearBaseDesechable();
    sql = base.sql;
    await base.aplicar((f) => f < '0013');
    await sql`INSERT INTO corp.closed_periods (period, closed_by, closed_at)
              VALUES ('2026-08', 'f1', now())`;
    await base.aplicar((f) => f >= '0013');
  });

  afterAll(() => base?.cerrar());

  const cerrado = async () =>
    (await sql`SELECT 1 FROM corp.closed_periods WHERE period = '2026-08'`).length === 1;

  it('keeps the old lock, which nothing removes directly', async () => {
    assert.ok(await cerrado());
    await assert.rejects(
      sql`DELETE FROM corp.closed_periods WHERE period = '2026-08'`,
      /both founders/,
    );
    await assert.rejects(sql`SELECT corp.reabrir_periodo('2026-08', 'f2', now())`, /answer/);
    assert.ok(await cerrado());
  });

  it('reopens it with a request and the other founder’s approval', async () => {
    await sql`INSERT INTO corp.period_events (period, kind, founder_id, motivo, at)
              VALUES ('2026-08', 'reapertura_pedida', 'f1', 'Falta el XML de Google', now())`;
    await sql`SELECT corp.reabrir_periodo('2026-08', 'f2', now())`;
    assert.equal(await cerrado(), false);
  });
});
