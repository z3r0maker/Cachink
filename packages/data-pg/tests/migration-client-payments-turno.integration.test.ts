import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * 0058: `caja_turno_id` on `client_payments` (ADR-146). An abono carries the
 * turno whose drawer received it; one written before the column, or with no
 * turno open, keeps null. The column list must match the device schema
 * (drift.test.ts proves that half).
 */
const { url, describe } = integrationSuite();
const BIZ = testId('E');

describe('0058 client_payments.caja_turno_id', () => {
  let db: Db;
  const turno = testId('T');

  beforeAll(async () => {
    db = createDb(url as string);
    const cliente = testId('C');
    await withBusiness(db, BIZ, async (tx) => {
      await tx.execute(sql`
        INSERT INTO client_payments (id, cliente_id, fecha, monto_centavos, metodo, nota,
                                     caja_turno_id, business_id, device_id, created_at, updated_at)
        VALUES (${testId('A')}, ${cliente}, '2026-11-18', 50_000, 'Efectivo', 'En el turno',
                ${turno}, ${BIZ}, ${BIZ}, now(), now()),
               (${testId('A')}, ${cliente}, '2026-11-18', 30_000, 'Efectivo', 'Sin turno',
                NULL, ${BIZ}, ${BIZ}, now(), now())`);
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('an abono keeps its turno, one with no turno open keeps null', async () => {
    const rows = await withBusiness(db, BIZ, (tx) =>
      tx.execute<{ nota: string; caja_turno_id: string | null }>(sql`
        SELECT nota, caja_turno_id FROM client_payments ORDER BY nota`),
    );
    assert.equal(rows.find((r) => r.nota === 'En el turno')?.caja_turno_id, turno);
    assert.equal(rows.find((r) => r.nota === 'Sin turno')?.caja_turno_id, null);
  });

  it('a turno finds only its own cash abonos', async () => {
    const rows = await withBusiness(db, BIZ, (tx) =>
      tx.execute<{ monto: string }>(sql`
        SELECT sum(monto_centavos)::text AS monto FROM client_payments
        WHERE caja_turno_id = ${turno} AND metodo = 'Efectivo'`),
    );
    assert.equal(BigInt(String(rows[0]?.monto)), 50_000n);
  });
});
