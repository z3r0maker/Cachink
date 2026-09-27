import assert from 'node:assert/strict';
import { afterAll, beforeAll, describe as plainDescribe, it } from 'vitest';
import postgres from 'postgres';

import { createDb, type Db } from '../src/client';
import {
  saveUsageCounters,
  USAGE_COUNTER_CHUNK,
  usageCountersOf,
  type UsageCountRow,
} from '../src/queries/metering';
import { integrationSuite } from './support/db';

/**
 * DB2-USE-01: the nightly job stores one counter per business per month in a
 * single INSERT, 5 parameters a row, and postgres.js refuses more than 65,534
 * parameters — so the job broke at about 6,550 tenants. It now writes in
 * chunks of `USAGE_COUNTER_CHUNK` rows.
 */
const rowsFor = (n: number, prefix: string, period: string): UsageCountRow[] =>
  Array.from({ length: n }, (_, i) => ({
    businessId: `${prefix}${String(i).padStart(6, '0')}`,
    period,
    transactions: i,
    activeProducts: 1,
  }));

/** Records the size of every INSERT the query builder is asked for. */
function recordingDb(): { db: Db; sizes: number[] } {
  const sizes: number[] = [];
  const chain = {
    values(v: unknown[]) {
      sizes.push(v.length);
      return { onConflictDoUpdate: () => Promise.resolve() };
    },
  };
  return { db: { insert: () => chain } as unknown as Db, sizes };
}

plainDescribe('saveUsageCounters chunks its INSERTs', () => {
  it('writes nothing for no rows', async () => {
    const { db, sizes } = recordingDb();
    await saveUsageCounters(db, [], '2099-01-01T00:00:00Z');
    assert.deepEqual(sizes, []);
  });

  it('keeps every INSERT at or under the chunk, and loses no row', async () => {
    const { db, sizes } = recordingDb();
    await saveUsageCounters(db, rowsFor(2_501, 'x', '2099-01'), '2099-01-01T00:00:00Z');
    assert.deepEqual(sizes, [USAGE_COUNTER_CHUNK, USAGE_COUNTER_CHUNK, 501]);
    assert.ok(USAGE_COUNTER_CHUNK * 5 < 65_534);
  });

  it('sends exactly one INSERT for a chunk-sized batch', async () => {
    const { db, sizes } = recordingDb();
    await saveUsageCounters(db, rowsFor(USAGE_COUNTER_CHUNK, 'x', '2099-01'), 'now');
    assert.deepEqual(sizes, [USAGE_COUNTER_CHUNK]);
  });
});

const { url, describe } = integrationSuite();

describe('saveUsageCounters past the parameter limit, as xangarro_metering', () => {
  // 14,000 rows × 5 parameters = 70,000: one INSERT would be refused.
  const N = 14_000;
  const prefix = `ZCHUNK${Date.now().toString(36).toUpperCase()}`;
  const period = '2098-12';
  let db: Db;
  let owner: postgres.Sql;

  beforeAll(() => {
    const u = new URL(url as string);
    u.username = 'xangarro_metering';
    u.password = 'xangarro_metering';
    db = createDb(u.toString());
    owner = postgres(process.env.DATABASE_SUPER_URL ?? (url as string), {
      max: 1,
      onnotice: () => undefined,
    });
  });

  afterAll(async () => {
    await owner`DELETE FROM usage_counters WHERE business_id LIKE ${`${prefix}%`}`;
    await owner.end({ timeout: 5 });
    await db.$client.end({ timeout: 5 });
  });

  it('stores every row, then overwrites them all on the next run', async () => {
    await saveUsageCounters(db, rowsFor(N, prefix, period), '2098-12-31T09:00:00Z');
    const again = rowsFor(N, prefix, period).map((r) => ({ ...r, transactions: 7 }));
    await saveUsageCounters(db, again, '2099-01-01T09:00:00Z');
    const stored = (await usageCountersOf(db, [period])).filter((r) =>
      r.businessId.startsWith(prefix),
    );
    assert.equal(stored.length, N);
    assert.ok(stored.every((r) => r.transactions === 7));
  });
});
