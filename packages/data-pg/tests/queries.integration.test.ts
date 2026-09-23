import { afterAll, beforeAll, it } from 'vitest';
import assert from 'node:assert/strict';

import { createDb, withBusiness, type Db } from '../src/client.js';
import { lastCortes, lowStock, recentActivity, totalsForRange } from '../src/queries/dashboard.js';
import { rejectionDigest } from '../src/queries/digest.js';
import { integrationSuite } from './support/db';
import {
  BORRADO,
  DASH_BIZ,
  ESPERADO,
  RANGO,
  STOCK,
  ULTIMO_CORTE,
  seedDashboardFixture,
} from './support/dashboard-fixture';

/**
 * Query integration (B-04 + the portal's read path).
 *
 * These run through the **app role**, so they exercise the policy as well as
 * the SQL. Requires the seed, not just the schema:
 * `pnpm --filter @xangarro/data-pg db:reset`.
 *
 * The dashboard reads assert against rows this suite inserts into a tenant of
 * its own (`./support/dashboard-fixture`). They used to assert the seeded
 * Taquería's totals, copied from `seed-data`, and went stale the day
 * `seed-finanzas` started generating two anchored months on top of those
 * fixtures: a frozen total cannot survive a seed whose rows move with the
 * calendar. The digest and the cross-tenant case still read the seed, because
 * what they assert — which rejection codes exist, and that another tenant's
 * rows are invisible — does not depend on any amount.
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const { url, describe } = integrationSuite();

describe('dashboard queries against real Postgres', () => {
  let db: Db;
  beforeAll(async () => {
    db = createDb(url as string);
    await seedDashboardFixture(db);
  });
  afterAll(async () => {
    await (db as unknown as { $client: { end: (o: object) => Promise<void> } }).$client.end({
      timeout: 5,
    });
  });

  it('totals the period in integer centavos, skipping borradas, canceladas y fuera de rango', async () => {
    const t = await withBusiness(db, DASH_BIZ, (tx) => totalsForRange(tx, RANGO.from, RANGO.to));
    assert.equal(t.ventas, ESPERADO.ventas);
    assert.equal(t.ventasCount, ESPERADO.ventasCount);
    assert.equal(t.gastos, ESPERADO.gastos);
    assert.equal(t.gastosCount, ESPERADO.gastosCount);
    assert.equal(t.utilidad, t.ventas - t.gastos);
    assert.equal(typeof t.ventas, 'bigint', 'money must never become a float');
    assert.equal(typeof t.gastos, 'bigint', 'money must never become a float');
  });

  it('narrows to a single day', async () => {
    const t = await withBusiness(db, DASH_BIZ, (tx) => totalsForRange(tx, RANGO.dia, RANGO.dia));
    assert.equal(t.ventas, ESPERADO.ventasDelDia);
    assert.equal(t.ventasCount, ESPERADO.ventasDelDiaCount);
    assert.ok(t.ventas < ESPERADO.ventas, 'one day must be narrower than its month');
  });

  it('returns recent activity newest first, ventas and gastos interleaved', async () => {
    const rows = await withBusiness(db, DASH_BIZ, (tx) => recentActivity(tx, 6));
    assert.equal(rows.length, 6);
    assert.ok(rows.some((r) => r.kind === 'venta'));
    assert.ok(rows.some((r) => r.kind === 'gasto'));
    assert.ok(!rows.some((r) => r.concepto === BORRADO), 'a soft-deleted row is not activity');
    assert.ok(
      rows.every((r) => typeof r.amount === 'bigint'),
      'money must never become a float',
    );
    const at = rows.map((r) => r.at);
    assert.deepEqual(at, [...at].sort().reverse(), 'must be newest first');
  });

  it('derives stock from movements, signing by tipo', async () => {
    const rows = await withBusiness(db, DASH_BIZ, (tx) => lowStock(tx));
    const byName = new Map(rows.map((r) => [r.producto, r]));
    for (const { nombre, umbral, stock } of STOCK) {
      if (stock > umbral) {
        assert.ok(!byName.has(nombre), `${nombre}: a well-stocked product must not appear`);
        continue;
      }
      // Summing `cantidad` raw would count the salidas as a restock.
      assert.equal(byName.get(nombre)?.stock, stock, `${nombre}: entradas menos salidas`);
      assert.equal(byName.get(nombre)?.umbral, umbral);
    }
    assert.ok(
      rows.every((r) => r.stock <= r.umbral),
      'every row returned is at or below its own umbral',
    );
  });

  it('returns the scarcest product first, comparing stock as a number', async () => {
    const rows = await withBusiness(db, DASH_BIZ, (tx) => lowStock(tx));
    // Derived from the fixture, like every other expectation here: adding a
    // producto moves its own row rather than a number restated beside it.
    const esperado = STOCK.filter((p) => p.stock <= p.umbral)
      .map((p) => p.stock)
      .sort((a, b) => a - b);
    assert.ok(esperado.length > 1, 'ordering cannot be proven on fewer than two rows');
    assert.deepEqual(
      rows.map((r) => r.stock),
      esperado,
      'scarcest first: ordering on the ::text cast returns 12 before 3',
    );
  });

  it('reads the latest corte by fecha, not by the order the rows arrived', async () => {
    const [corte] = await withBusiness(db, DASH_BIZ, (tx) => lastCortes(tx, 1));
    assert.equal(corte?.fecha, ULTIMO_CORTE.fecha);
    assert.equal(corte?.diferencia, ULTIMO_CORTE.diferencia);
    assert.equal(typeof corte?.diferencia, 'bigint', 'money must never become a float');
  });

  it('returns nothing for a business the caller does not belong to', async () => {
    const t = await withBusiness(db, '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ', (tx) =>
      totalsForRange(tx, RANGO.from, RANGO.to),
    );
    assert.equal(t.ventas, 0n, 'RLS must hide another tenant, not merely filter it');
    assert.equal(t.ventasCount, 0);
  });

  it('digests unresolved rejections by code, most frequent first, and nothing from the future', async () => {
    const all = await withBusiness(db, BIZ, (tx) => rejectionDigest(tx, '2000-01-01'));
    const codes = all.map((r) => r.code);
    assert.ok(codes.includes('FK_PRODUCT_MISSING') && codes.includes('HYBRID_UPDATE_FORBIDDEN'));
    assert.deepEqual(
      all.map((r) => r.n),
      [...all.map((r) => r.n)].sort((a, b) => b - a),
    );
    assert.deepEqual(await withBusiness(db, BIZ, (tx) => rejectionDigest(tx, '2999-01-01')), []);
  });
});
