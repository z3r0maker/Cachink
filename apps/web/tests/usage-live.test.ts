import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * The usage composition root (N-02/N-03), every adapter mocked: the metering
 * role is memoised and refuses to run without its URL; the nightly recompute
 * wires every adapter; the after-push refresh is silent where metering is not
 * configured (local runs), corrects through the use case where it is, and a
 * failure is reported — a push is never failed over a counter; and `usageFor`
 * shapes the business's row as C-12's payload, null when there is none.
 */

const execute = vi.fn();
const refreshExecute = vi.fn();
const usageCounterOf = vi.fn();
const reportError = vi.fn();

vi.mock('@xangarro/application/usage', () => ({
  RecomputeUsageUseCase: vi.fn(function (this: unknown) {
    Object.assign(this, { execute });
    return this;
  }),
  RefreshUsageUseCase: vi.fn(function (this: unknown) {
    Object.assign(this, { execute: refreshExecute });
    return this;
  }),
}));
vi.mock('@xangarro/data-pg', () => ({
  createDb: vi.fn(() => ({ db: true })),
  usageCounterOf: (...a: unknown[]) => usageCounterOf(...a),
}));
vi.mock('../src/server/billing/config', () => ({ billingDb: () => ({ billing: true }) }));
vi.mock('../src/server/observability/report', () => ({ reportError }));
vi.mock('../src/server/email/usage', () => ({ notifyUsageThreshold: vi.fn() }));
vi.mock('../src/server/support-inbox', () => ({ supportInboxFromEnv: () => ({ inbox: true }) }));
vi.mock('../src/server/usage/adapters', () => ({
  pgUsageCounters: () => ({}),
  pgUsageCounts: () => ({}),
  pgUsageLimits: () => ({}),
  pgUsageNoticeLedger: () => ({}),
}));
vi.mock('../src/server/usage/owner-notifier', () => ({
  emailUsageNotifier: () => ({}),
  ownerEmailRecipients: () => ({}),
}));

const { meteringDb, refreshUsageAfterPush, runUsageRecompute, usageFor } =
  await import('../src/server/usage/live');

beforeEach(() => {
  vi.clearAllMocks();
  process.env.METERING_DATABASE_URL = 'postgres://metering@localhost/xangarro';
});

afterEach(() => {
  delete process.env.METERING_DATABASE_URL;
});

describe('meteringDb', () => {
  it('refuses without the URL — the metering role is never guessed', () => {
    delete process.env.METERING_DATABASE_URL;
    assert.throws(() => meteringDb(), /METERING_DATABASE_URL/);
  });

  it('memoises: one client for the process', () => {
    assert.equal(meteringDb(), meteringDb());
  });
});

describe('runUsageRecompute', () => {
  it('wires every adapter and runs', async () => {
    execute.mockResolvedValue({ ok: true });
    const ahora = new Date('2026-09-01T06:00:00.000Z');
    await runUsageRecompute(ahora);
    assert.equal(execute.mock.calls.length, 1);
  });
});

describe('refreshUsageAfterPush', () => {
  it('silent where metering is not configured', async () => {
    delete process.env.METERING_DATABASE_URL;
    await refreshUsageAfterPush('biz-1');
    assert.equal(refreshExecute.mock.calls.length, 0);
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('corrects through the use case; a failure is reported, never thrown', async () => {
    refreshExecute.mockResolvedValue(undefined);
    await refreshUsageAfterPush('biz-1');
    assert.equal(refreshExecute.mock.calls.length, 1);

    refreshExecute.mockRejectedValueOnce(new Error('connection'));
    await refreshUsageAfterPush('biz-1');
    assert.equal(reportError.mock.calls.length, 1);
    assert.deepEqual(reportError.mock.calls[0]?.[1], {
      endpoint: 'sync/push:usage',
      businessId: 'biz-1',
    });
  });
});

describe('usageFor', () => {
  it('shapes the business’s row as C-12’s payload; null when there is none', async () => {
    usageCounterOf.mockResolvedValue(null);
    assert.equal(await usageFor('biz-1'), null);

    usageCounterOf.mockResolvedValue({
      period: '2026-09',
      transactions: 212,
      activeProducts: 18,
      computedAt: '2026-09-28T06:00:00.000Z',
    });
    assert.deepEqual(await usageFor('biz-1'), {
      period: '2026-09',
      transactions: 212,
      products: 18,
      computedAt: '2026-09-28T06:00:00.000Z',
    });
  });
});
