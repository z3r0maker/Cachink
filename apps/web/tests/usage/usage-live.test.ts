import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type { UsageSnapshot } from '@xangarro/domain/usage';

import {
  meteringDb,
  refreshUsageAfterPush,
  runUsageRecompute,
  usageFor,
} from '../../src/server/usage/live';

/**
 * The usage composition root (N-02 / N-03) with the real use cases over
 * in-memory ports: which connection each side gets, the clock it is handed,
 * and what the push-time refresh does when metering is off or failing. The
 * E2E server has no `METERING_DATABASE_URL`, so none of it runs there.
 */

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const NOW = new Date('2026-09-18T09:00:00.000Z');

const io = vi.hoisted(() => ({
  counted: [] as unknown[],
  saved: [] as { rows: unknown[]; at: string }[],
  dbs: [] as string[],
  counterRow: null as unknown,
  countFails: false,
  reported: [] as { error: unknown; scope: unknown }[],
}));

vi.mock('@xangarro/data-pg', () => ({
  createDb: (url: string) => {
    io.dbs.push(url);
    return { url };
  },
  usageCounterOf: async (_db: unknown, businessId: string, period: string) => {
    io.counted.push({ businessId, period });
    return io.counterRow;
  },
}));
vi.mock('../../src/server/usage/adapters', () => ({
  pgUsageCounts: () => ({
    count: async (first: string, last: string, ids?: readonly string[]) => {
      if (io.countFails) throw new Error('metering down');
      io.counted.push({ first, last, ids });
      const snapshot: UsageSnapshot = {
        businessId: BIZ,
        period: last,
        transactions: 120,
        activeProducts: 6,
      };
      return [snapshot];
    },
  }),
  pgUsageCounters: () => ({
    save: async (rows: unknown[], at: string) => void io.saved.push({ rows, at }),
    computedAt: async () => null,
    history: async () => [],
  }),
  pgUsageLimits: () => ({ limitsOf: async () => new Map() }),
  pgUsageNoticeLedger: () => ({ begin: async () => 'new', finish: async () => undefined }),
}));
vi.mock('../../src/server/usage/owner-notifier', () => ({
  emailUsageNotifier: () => ({ notify: async () => undefined }),
  ownerEmailRecipients: () => ({}),
}));
vi.mock('../../src/server/email/usage', () => ({ notifyUsageThreshold: async () => undefined }));
vi.mock('../../src/server/billing/config', () => ({ billingDb: () => ({ billing: true }) }));
vi.mock('../../src/server/support-inbox', () => ({
  supportInboxFromEnv: () => ({ file: async () => undefined }),
}));
vi.mock('../../src/server/observability/report', () => ({
  reportError: (error: unknown, scope: unknown) => void io.reported.push({ error, scope }),
}));

beforeEach(() => {
  io.counted = [];
  io.saved = [];
  io.dbs = [];
  io.counterRow = null;
  io.countFails = false;
  io.reported = [];
  vi.stubEnv('METERING_DATABASE_URL', 'postgres://metering@localhost/xangarro');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('meteringDb', () => {
  it('refuses to run without METERING_DATABASE_URL — never the service role', () => {
    vi.stubEnv('METERING_DATABASE_URL', '');
    assert.throws(() => meteringDb(), /METERING_DATABASE_URL is not set/);
  });

  it('opens one connection and keeps it', () => {
    const a = meteringDb();
    assert.equal(meteringDb(), a);
  });
});

describe('runUsageRecompute', () => {
  it('counts last month and this one, stamped with the cron’s clock', async () => {
    const result = await runUsageRecompute(NOW);
    assert.deepEqual(result, {
      current: '2026-09',
      previous: '2026-08',
      businesses: 1,
      notices: 0,
      failures: [],
    });
    assert.deepEqual(io.counted, [{ first: '2026-08', last: '2026-09', ids: undefined }]);
    assert.equal(io.saved[0]?.at, NOW.toISOString());
  });
});

describe('refreshUsageAfterPush', () => {
  it('recounts only the pushing business’s open month', async () => {
    await refreshUsageAfterPush(BIZ, NOW);
    assert.deepEqual(io.counted, [{ first: '2026-09', last: '2026-09', ids: [BIZ] }]);
    assert.equal(io.saved.length, 1);
  });

  it('does nothing where metering is not configured', async () => {
    vi.stubEnv('METERING_DATABASE_URL', '');
    await refreshUsageAfterPush(BIZ, NOW);
    assert.deepEqual(io.counted, []);
    assert.deepEqual(io.reported, []);
  });

  it('reports a failed recount and never fails the push', async () => {
    io.countFails = true;
    await refreshUsageAfterPush(BIZ, NOW);
    assert.equal(io.reported.length, 1);
    assert.deepEqual(io.reported[0]?.scope, { endpoint: 'sync/push:usage', businessId: BIZ });
  });
});

describe('usageFor', () => {
  it('shapes the stored counter as the pull’s usage block', async () => {
    io.counterRow = {
      businessId: BIZ,
      period: '2026-09',
      transactions: 120,
      activeProducts: 6,
      computedAt: '2026-09-18T09:00:00.000Z',
    };
    assert.deepEqual(await usageFor(BIZ, NOW), {
      period: '2026-09',
      transactions: 120,
      products: 6,
      computedAt: '2026-09-18T09:00:00.000Z',
    });
    assert.deepEqual(io.counted, [{ businessId: BIZ, period: '2026-09' }]);
  });

  it('is null for a business never counted this month', async () => {
    assert.equal(await usageFor(BIZ, NOW), null);
  });
});
