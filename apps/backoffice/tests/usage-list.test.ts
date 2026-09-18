import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { UsageRecord } from '@xangarro/domain/usage';

import { TenantError } from '@/server/tenants/errors';
import { listUsage, MAX_BATCHES, SCAN_BATCH, type UsageListResult } from '@/server/usage/list';

import { bid, NOW } from './support/tenants';
import { comp, sales, usageFixture } from './support/usage';

const SEP = '2026-09-10T18:00:00.000Z';
const AUG = '2026-08-10T18:00:00.000Z';
const JUL = '2026-07-10T18:00:00.000Z';
const ids = (r: UsageListResult) => r.rows.map((x) => x.tenant.id);

async function rejects(p: Promise<unknown>, code: TenantError['code']) {
  await assert.rejects(p, (e) => e instanceof TenantError && e.code === code);
}

describe('listUsage', () => {
  it('scores this MX month per OQ-5 against the plan the tenant would get (free while unknown)', async () => {
    const f = usageFixture();
    const records: UsageRecord[] = [
      ...sales(30, SEP),
      { kind: 'gasto', at: SEP },
      { kind: 'movimientoInventario', at: SEP, origen: 'manual' },
      { kind: 'movimientoInventario', at: SEP, origen: 'venta' },
      { kind: 'corteDeDia', at: SEP },
      // 23:30 on 31 Aug in Mexico City is 1 Sep UTC: it belongs to August.
      { kind: 'gasto', at: '2026-09-01T05:30:00.000Z' },
      { kind: 'producto', deletedAt: null },
    ];
    f.add(1, records);
    const res = await listUsage(f.deps, {}, NOW);
    const row = res.rows[0];
    assert.equal(res.period, '2026-09');
    assert.equal(row?.current.transactions.value, 32);
    assert.equal(row?.current.transactions.percent, 64);
    assert.equal(row?.current.transactions.band, null);
    assert.equal(row?.current.activeProducts.value, 1);
    assert.equal(row?.previous?.transactions, 1);
    assert.equal(row?.plan.effective, null);
    assert.equal(res.billingKnown, false);
  });

  it('"sobre el límite" keeps tenants at or over 100 % this month', async () => {
    const f = usageFixture();
    f.add(1, sales(40, SEP));
    f.add(2, sales(50, SEP));
    f.add(3, sales(80, SEP));
    const res = await listUsage(f.deps, { filtro: 'sobre' }, NOW);
    assert.deepEqual(ids(res), [bid(3), bid(2)]);
    assert.deepEqual(
      res.rows.map((r) => r.current.transactions.band),
      [150, 100],
    );
  });

  it('"2 meses seguidos" needs both closed months over, not this one', async () => {
    const f = usageFixture();
    f.add(1, [...sales(50, JUL), ...sales(60, AUG)]);
    f.add(2, sales(60, AUG));
    f.add(3, [...sales(10, JUL), ...sales(10, AUG), ...sales(500, SEP)]);
    const res = await listUsage(f.deps, { filtro: 'dos_meses' }, NOW);
    assert.deepEqual(ids(res), [bid(1)]);
  });

  it('a comped paid plan is unlimited, so it is not over', async () => {
    const f = usageFixture();
    const id = f.add(1, sales(500, SEP));
    await f.overrides.insert(comp(id));
    const res = await listUsage(f.deps, { filtro: 'sobre' }, NOW);
    assert.deepEqual(ids(res), []);
    const all = await listUsage(f.deps, {}, NOW);
    assert.equal(all.rows[0]?.current.transactions.percent, null);
  });

  it('pages newest first with a keyset cursor', async () => {
    const f = usageFixture();
    for (const n of [1, 2, 3]) f.add(n);
    const first = await listUsage(f.deps, { limit: 2 }, NOW);
    assert.deepEqual(ids(first), [bid(3), bid(2)]);
    assert.ok(first.nextCursor);
    const second = await listUsage(f.deps, { limit: 2, cursor: first.nextCursor }, NOW);
    assert.deepEqual(ids(second), [bid(1)]);
    assert.equal(second.nextCursor, null);
  });

  it('a filtered scan stops at its cap and hands back where it stopped', async () => {
    const f = usageFixture();
    const total = SCAN_BATCH * MAX_BATCHES + 5;
    for (let n = 1; n <= total; n += 1) f.add(n);
    const res = await listUsage(f.deps, { filtro: 'sobre' }, NOW);
    assert.equal(res.rows.length, 0);
    assert.equal(res.partial, true);
    assert.ok(res.nextCursor);
    assert.equal(f.source.queries.length, MAX_BATCHES);
    const rest = await listUsage(f.deps, { filtro: 'sobre', cursor: res.nextCursor }, NOW);
    assert.equal(rest.partial, false);
    assert.equal(rest.nextCursor, null);
  });

  it('rejects an unknown filter', async () => {
    await rejects(listUsage(usageFixture().deps, { filtro: 'todo' }, NOW), 'VALIDATION');
  });

  it('rejects a page size out of range', async () => {
    await rejects(listUsage(usageFixture().deps, { limit: 0 }, NOW), 'VALIDATION');
  });

  it('rejects a cursor it did not issue', async () => {
    await rejects(listUsage(usageFixture().deps, { cursor: 'bm9wZQ' }, NOW), 'INVALID_CURSOR');
  });

  it('wraps a store failure', async () => {
    const f = usageFixture();
    f.add(1);
    f.source.page = () => Promise.reject(new Error('connection refused'));
    await rejects(listUsage(f.deps, {}, NOW), 'STORE_FAILED');
  });
});
