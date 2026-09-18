import { afterAll, beforeAll, it } from 'vitest';
import assert from 'node:assert/strict';

import { createDb, withBusiness, type Db } from '../src/client.js';
import { lastCortes, lowStock, recentActivity, totalsForRange } from '../src/queries/dashboard.js';
import { integrationSuite } from './support/db';

/**
 * Query integration (B-04 + the portal's read path).
 *
 * These run against the seeded Taquería Don Pedro through the **app role**, so
 * they exercise the policy as well as the SQL. Requires the seed, not just the
 * schema: `pnpm --filter @xangarro/data-pg db:reset`.
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const { url, describe } = integrationSuite();

describe('dashboard queries against real Postgres', () => {
  let db: Db;
  beforeAll(() => {
    db = createDb(url as string);
  });
  afterAll(async () => {
    await (db as unknown as { $client: { end: (o: object) => Promise<void> } }).$client.end({
      timeout: 5,
    });
  });

  it('totals the seeded period in integer centavos', async () => {
    const t = await withBusiness(db, BIZ, (tx) => totalsForRange(tx, '2026-05-01', '2026-05-31'));
    // 75 + 60 + 60 + 80 + 250 + 120 = 645.00
    assert.equal(t.ventas, 64_500n);
    assert.equal(t.ventasCount, 6);
    // 420 + 340 + 8150 + 6000 + 1800 = 16,710.00
    assert.equal(t.gastos, 1_671_000n);
    assert.equal(t.utilidad, t.ventas - t.gastos);
    assert.equal(typeof t.ventas, 'bigint', 'money must never become a float');
  });

  it('narrows to a single day', async () => {
    const t = await withBusiness(db, BIZ, (tx) => totalsForRange(tx, '2026-05-12', '2026-05-12'));
    assert.equal(t.ventas, 19_500n); // 75 + 60 + 60
    assert.equal(t.ventasCount, 3);
  });

  it('returns recent activity newest first, ventas and gastos interleaved', async () => {
    const rows = await withBusiness(db, BIZ, (tx) => recentActivity(tx, 6));
    assert.equal(rows.length, 6);
    assert.ok(rows.some((r) => r.kind === 'venta'));
    assert.ok(rows.some((r) => r.kind === 'gasto'));
    const at = rows.map((r) => r.at);
    assert.deepEqual(at, [...at].sort().reverse(), 'must be newest first');
  });

  it('derives stock from movements, signing by tipo', async () => {
    const rows = await withBusiness(db, BIZ, (tx) => lowStock(tx));
    const byName = new Map(rows.map((r) => [r.producto, r]));
    // Refresco: +12 in, nothing sold → 12, threshold 24 → low.
    assert.equal(byName.get('Refresco')?.stock, 12);
    // Tortilla: +3 in, threshold 10 → low.
    assert.equal(byName.get('Tortilla (kg)')?.stock, 3);
    // Taco al pastor: +120 in, 13 sold → 107, threshold 40 → not low.
    assert.ok(!byName.has('Taco al pastor'), 'a well-stocked product must not appear');
  });

  it('reads the latest corte', async () => {
    const [corte] = await withBusiness(db, BIZ, (tx) => lastCortes(tx, 1));
    assert.equal(corte?.fecha, '2026-05-11');
    assert.equal(corte?.diferencia, -600n);
  });

  it('returns nothing for a business the caller does not belong to', async () => {
    const t = await withBusiness(db, '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ', (tx) =>
      totalsForRange(tx, '2026-05-01', '2026-05-31'),
    );
    assert.equal(t.ventas, 0n, 'RLS must hide another tenant, not merely filter it');
    assert.equal(t.ventasCount, 0);
  });
});
