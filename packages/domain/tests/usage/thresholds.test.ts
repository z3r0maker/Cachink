import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  crossedThresholds,
  InvalidUsageLimitsError,
  UsageSnapshotMismatchError,
  type UsageLimits,
  type UsageSnapshot,
} from '../../src/usage/index.js';

const LIMITS: UsageLimits = { transactionsPerMonth: 300, activeProducts: 50 };
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

function snap(transactions: number, activeProducts = 0, period = '2026-09'): UsageSnapshot {
  return { businessId: BIZ, period, transactions, activeProducts };
}

describe('crossedThresholds', () => {
  it('reports 80 % to the owner only, with an idempotency key', () => {
    const out = crossedThresholds(snap(239), snap(240), LIMITS);
    assert.deepEqual(out, [
      {
        businessId: BIZ,
        period: '2026-09',
        metric: 'transactions',
        threshold: 80,
        recipients: ['owner'],
        messageCode: 'USAGE_NEAR_LIMIT',
        idempotencyKey: `${BIZ}:2026-09:transactions:80`,
      },
    ]);
  });

  it('notifies owner + provider at 100 % and only the provider at 150 %', () => {
    const at100 = crossedThresholds(snap(299), snap(300), LIMITS);
    assert.deepEqual(
      at100.map((c) => [c.threshold, c.recipients, c.messageCode]),
      [[100, ['owner', 'provider'], 'USAGE_AT_LIMIT']],
    );
    const at150 = crossedThresholds(snap(449), snap(450), LIMITS);
    assert.deepEqual(
      at150.map((c) => [c.threshold, c.recipients, c.messageCode]),
      [[150, ['provider'], 'USAGE_WELL_OVER_LIMIT']],
    );
  });

  it('reports every threshold jumped over in one step, per metric', () => {
    const out = crossedThresholds(snap(10, 10), snap(500, 41), LIMITS);
    assert.deepEqual(
      out.map((c) => `${c.metric}:${c.threshold}`),
      ['transactions:80', 'transactions:100', 'transactions:150', 'activeProducts:80'],
    );
  });

  it('treats a missing previous snapshot as zero usage', () => {
    const out = crossedThresholds(null, snap(240), LIMITS);
    assert.deepEqual(
      out.map((c) => c.threshold),
      [80],
    );
  });

  it('starts counting afresh when the previous snapshot is from another month', () => {
    const out = crossedThresholds(snap(400, 0, '2026-08'), snap(240), LIMITS);
    assert.deepEqual(
      out.map((c) => c.threshold),
      [80],
    );
  });

  it('reports nothing when usage stays below, stays above or drops', () => {
    assert.deepEqual(crossedThresholds(snap(100), snap(200), LIMITS), []);
    assert.deepEqual(crossedThresholds(snap(250), snap(260), LIMITS), []);
    assert.deepEqual(crossedThresholds(snap(320), snap(200), LIMITS), []);
  });

  it('reports nothing for an unlimited metric', () => {
    const limits: UsageLimits = { transactionsPerMonth: null, activeProducts: null };
    assert.deepEqual(crossedThresholds(snap(0), snap(1_000_000, 9_999), limits), []);
  });

  it('rejects snapshots of different businesses', () => {
    const other = { ...snap(10), businessId: '01HZ8XQN9GZJXV8AKQ5X0C7OTH' };
    assert.throws(() => crossedThresholds(other, snap(240), LIMITS), UsageSnapshotMismatchError);
  });

  it('rejects zero, negative or fractional limits', () => {
    for (const bad of [0, -1, 1.5]) {
      const limits = { transactionsPerMonth: bad, activeProducts: 50 };
      assert.throws(() => crossedThresholds(null, snap(1), limits), InvalidUsageLimitsError);
    }
  });

  it('never exposes anything that could block a write', () => {
    const out = crossedThresholds(null, snap(10_000, 10_000), LIMITS);
    for (const c of out) assert.equal('block' in c || 'allowed' in c, false);
  });
});
