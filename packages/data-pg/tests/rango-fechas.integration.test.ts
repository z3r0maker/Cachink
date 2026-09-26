import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import { periodBalanceInputs, serieDiaria, totalsForRange } from '../src/queries';
import { integrationSuite } from './support/db';
import { seedLedger, type LedgerFixture } from './support/ledger-fixture';
import { testId } from './support/test-ids';

/**
 * Sargable day ranges (DB2-QRY-04) keep the old `left(fecha, 10)` meaning:
 * a timestamped fecha counts on its own day — including the **last** day of
 * a range, which `totalsForRange`'s `fecha <= to` used to drop — and nothing
 * from the day after leaks in. The daily series still adds up to the totals.
 */
const { url, describe } = integrationSuite();

describe('day ranges over text fechas', () => {
  let app: Db;
  let owner: postgres.Sql;
  let fx: LedgerFixture;

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    fx = await seedLedger(owner, 'F');
    const cliente = testId('C');
    const now = new Date('2026-05-12T14:00:00Z');
    const fila = { business_id: fx.biz, device_id: fx.dev, created_at: now, updated_at: now };
    await owner`INSERT INTO clients ${owner({ id: cliente, nombre: 'Doña Mary', ...fila })}`;
    for (const [fecha, monto] of [
      ['2026-05-31T20:00:00-06:00', 1_000],
      ['2026-06-01', 7],
    ] as const) {
      await owner`INSERT INTO client_payments ${owner({ id: testId('A'), cliente_id: cliente, fecha, monto_centavos: monto, metodo: 'Efectivo', ...fila })}`;
    }
  });

  afterAll(async () => {
    await owner`DELETE FROM businesses WHERE id = ${fx.biz}`;
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('totals keep a timestamped last day, and drop cancelled, deleted and outside rows', async () => {
    const t = await withBusiness(app, fx.biz, (tx) =>
      totalsForRange(tx, '2026-05-01', '2026-05-31'),
    );
    // 2500 + 1500 (the ticket of two) + 8000 (31st, timestamped) + 2000 (the 1st).
    assert.equal(t.ventas, 14_000n);
    assert.equal(t.ventasCount, 4);
    assert.equal(t.gastos, 300_000n + 500_000n);
    const dia = await withBusiness(app, fx.biz, (tx) =>
      totalsForRange(tx, '2026-05-31', '2026-05-31'),
    );
    assert.deepEqual([dia.ventas, dia.gastos], [8_000n, 200_000n]);
  });

  it('the series puts a timestamped fecha on its day and sums to the totals', async () => {
    const [s, t] = await withBusiness(
      app,
      fx.biz,
      async (tx) =>
        [
          await serieDiaria(tx, '2026-05-01', '2026-05-31'),
          await totalsForRange(tx, '2026-05-01', '2026-05-31'),
        ] as const,
    );
    assert.equal(s.length, 31);
    assert.deepEqual(s.at(-1), { fecha: '2026-05-31', ventas: 8_000n, gastos: 200_000n });
    assert.deepEqual(s[9], { fecha: '2026-05-10', ventas: 4_000n, gastos: 0n });
    assert.deepEqual(s[10], { fecha: '2026-05-11', ventas: 0n, gastos: 0n }, 'cancelled');
    assert.equal(
      s.reduce((a, d) => a + d.ventas, 0n),
      t.ventas,
    );
    assert.equal(
      s.reduce((a, d) => a + d.gastos, 0n),
      t.gastos,
    );
  });

  it('a range open to the end of time still binds its start', async () => {
    const t = await withBusiness(app, fx.biz, (tx) =>
      totalsForRange(tx, '2026-06-01', '9999-12-31'),
    );
    assert.deepEqual([t.ventas, t.gastos], [900n, 1n]);
  });

  it('the balance inputs take a timestamped abono on the last day, not the next', async () => {
    const i = await withBusiness(app, fx.biz, (tx) =>
      periodBalanceInputs(tx, '2026-05-01', '2026-05-31'),
    );
    assert.deepEqual(
      i.pagos.map((p) => p.montoCentavos),
      [1_000n],
    );
  });

  it('a malformed bound is refused, not widened', async () => {
    await assert.rejects(
      withBusiness(app, fx.biz, (tx) => totalsForRange(tx, '2026-05-01', 'mayo')),
      TypeError,
    );
  });
});
