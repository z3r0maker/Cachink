import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * 0027: `empleado_id` on `expenses` (O-26). Payroll payments gain a real link
 * to their employee — nullable, because every writer before it (and every
 * non-payroll expense, ever) has none. The column list must match the device
 * schema (drift.test.ts proves that half).
 */
const { url, describe } = integrationSuite();
const BIZ = testId('E');

describe('0027 expenses.empleado_id', () => {
  let db: Db;

  beforeAll(async () => {
    db = createDb(url as string);
    const empleado = testId('L');
    await withBusiness(db, BIZ, async (tx) => {
      await tx.execute(sql`
        INSERT INTO employees (id, nombre, puesto, salario_centavos, periodo,
                               business_id, device_id, created_at, updated_at)
        VALUES (${empleado}, 'Rosa Medina', 'Mostrador', 150_000, 'semanal',
                ${BIZ}, ${BIZ}, now(), now())`);
      await tx.execute(sql`
        INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, empleado_id,
                              business_id, device_id, created_at, updated_at)
        VALUES (${testId('X')}, '2026-05-10', 'Nómina Rosa', 'Nómina', 75_000, ${empleado},
                ${BIZ}, ${BIZ}, now(), now()),
               (${testId('X')}, '2026-05-11', 'Gas', 'Servicios', 3_000, NULL,
                ${BIZ}, ${BIZ}, now(), now())`);
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('a payroll payment keeps its employee, another expense keeps its null', async () => {
    const rows = await withBusiness(db, BIZ, (tx) =>
      tx.execute<{ concepto: string; empleado_id: string | null }>(sql`
        SELECT concepto, empleado_id FROM expenses ORDER BY concepto`),
    );
    const nomina = rows.find((r) => r.concepto === 'Nómina Rosa');
    const gas = rows.find((r) => r.concepto === 'Gas');
    assert.ok(nomina?.empleado_id, 'the payroll payment names its employee');
    assert.equal(gas?.empleado_id, null, 'an ordinary expense has none');
  });

  it('the drawer query finds an employee’s payments by the link, not by name', async () => {
    const empleado = await withBusiness(db, BIZ, (tx) =>
      tx.execute<{ id: string }>(sql`SELECT id FROM employees LIMIT 1`),
    );
    const pagos = await withBusiness(db, BIZ, (tx) =>
      tx.execute<{ concepto: string }>(sql`
        SELECT concepto FROM expenses WHERE empleado_id = ${empleado[0]?.id}`),
    );
    assert.deepEqual(
      pagos.map((p) => p.concepto),
      ['Nómina Rosa'],
    );
  });
});
