/**
 * Audit round 3, DB3-L-02 and DB3-L-03: the pull honours Retry-After; a
 * whole-batch failure costs innocent retries no attempt; an HTTP-date wait is
 * not at the mercy of the device clock; due retries go oldest first, and rows
 * gone locally neither starve them nor spin the drain.
 */

import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';
import { startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import { DrizzleAppConfigRepository, type AppConfigRepository } from '@xangarro/data';
import { ApiClient } from '../src/api-client.js';
import { pullAll } from '../src/pull.js';
import { drainPush } from '../src/push.js';
import { MAX_DATE_WAIT_MS, parseRetryAfter } from '../src/retry-after.js';
import { StatusStore, backoffMs } from '../src/status-store.js';
import { SYNC_CONFIG_KEYS } from '../src/sync-keys.js';
import { activatedDevice, pushDeps, ringSale } from './helpers/device.js';

let mock: RunningMock;
beforeAll(async () => {
  mock = await startMockServer(0);
});
afterAll(async () => {
  await mock.close();
});

const answering = (status: number, headers: Record<string, string> = {}): ApiClient =>
  new ApiClient({
    baseUrl: 'http://x',
    fetchImpl: (async () =>
      new Response(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'espera' } }), {
        status,
        headers,
      })) as typeof fetch,
  });

const t0 = new Date('2026-09-16T23:00:00.000Z');
const at = (ms: number): Date => new Date(t0.getTime() + ms);
const retry = { code: 'INTERNAL', message: 'x', retryable: true };

describe('pullAll · being told to wait (DB3-L-02)', () => {
  it('carries the server Retry-After, as the push does', async () => {
    const d = await activatedDevice(mock.url);
    const deps = { ...pushDeps(d, mock.url), client: answering(429, { 'Retry-After': '7' }) };
    const out = await pullAll(deps);
    assert.deepEqual(
      [out.error?.code, out.error?.status, out.error?.retryAfterMs],
      ['RATE_LIMITED', 429, 7_000],
    );
  });
});

describe('Retry-After as an HTTP date (DB3-L-02)', () => {
  const nowMs = Date.parse('2026-09-16T23:00:00Z');

  it("measures the date against the server's own Date header when it sends one", () => {
    const server = 'Wed, 16 Sep 2026 20:00:00 GMT'; // the device clock is 3 h ahead
    const until = 'Wed, 16 Sep 2026 20:00:30 GMT';
    assert.equal(parseRetryAfter(until, nowMs, server), 30_000);
  });

  it('clamps a date-based wait against a skewed device clock', () => {
    const far = new Date(nowMs + 3 * 3_600_000).toUTCString(); // the device clock is 3 h behind
    assert.equal(parseRetryAfter(far, nowMs), MAX_DATE_WAIT_MS);
    assert.equal(parseRetryAfter(far, nowMs, 'no es fecha'), MAX_DATE_WAIT_MS);
    assert.ok(MAX_DATE_WAIT_MS <= 5 * 60_000);
  });

  it('leaves delay-seconds alone', () => {
    assert.equal(parseRetryAfter('900', nowMs), 900_000);
  });

  it('reads the Date header from a response', async () => {
    const date = new Date(Date.now() - 3_600_000);
    const until = new Date(date.getTime() + 20_000).toUTCString();
    const res = await answering(503, { 'Retry-After': until, Date: date.toUTCString() }).pull(
      't',
      0,
    );
    assert.equal(res.ok ? null : res.retryAfterMs, 20_000);
  });
});

describe('StatusStore · retries (DB3-L-02, DB3-L-03)', () => {
  it('counts no attempt against retries whose batch failed as a whole', async () => {
    const d = await activatedDevice(mock.url);
    await ringSale(d);
    const store = new StatusStore(d.db);
    await store.markRejected('sales', 'S1', retry, t0);
    await store.restoreRetries([{ tableName: 'sales', rowId: 'S1', op: 'insert' }], at(1));
    const [entry] = await store.listRejected(1);
    assert.deepEqual([entry?.attempts, entry?.retryable], [1, true]);
    assert.deepEqual(await store.dueRetries(at(1 + backoffMs(1) / 2 - 1), 10), []);
  });

  it('hands out due retries oldest first', async () => {
    const d = await activatedDevice(mock.url);
    const store = new StatusStore(d.db, { random: () => 1 });
    await store.markRejected('sales', 'LATE', retry, at(30_000));
    await store.markRejected('sales', 'EARLY', retry, at(0));
    await store.markRejected('sales', 'MID', retry, at(10_000));
    const due = await store.dueRetries(at(10 * backoffMs(1)), 2);
    assert.deepEqual(
      due.map((c) => c.rowId),
      ['EARLY', 'MID'],
    );
  });
});

describe('drainPush · retries whose row is gone (DB3-L-03)', () => {
  it('forgets them, so they neither starve a real retry nor spin the drain', async () => {
    const d = await activatedDevice(mock.url);
    const store = new StatusStore(d.db, { random: () => 1 });
    for (let i = 0; i < 150; i += 1)
      await store.markRejected('sales', `GONE${String(i).padStart(3, '0')}`, retry, at(0));
    await ringSale(d);
    await drainPush(pushDeps(d, mock.url, { now: at(0) }));
    const [ticket] = (await d.db.all(sql`SELECT id FROM tickets LIMIT 1`)) as { id: string }[];
    await store.markRejected('tickets', ticket!.id, retry, at(1_000));
    const reads: string[] = [];
    const appConfig = new DrizzleAppConfigRepository(d.db);
    const counting: AppConfigRepository = {
      get: async (key) => {
        if (key === SYNC_CONFIG_KEYS.pushHwm) reads.push(key);
        return appConfig.get(key);
      },
      set: (key, value) => appConfig.set(key, value),
      delete: (key) => appConfig.delete(key),
      list: () => appConfig.list(),
    };
    const deps = {
      ...pushDeps(d, mock.url, { now: at(backoffMs(1) + 2_000) }),
      appConfig: counting,
    };
    const first = await drainPush(deps);
    const second = await drainPush(deps);
    assert.equal(first.accepted + second.accepted, 1, 'the real retry went');
    assert.ok(reads.length <= 4, `${reads.length} rounds for two drains`);
    assert.deepEqual(await store.countByStatus(), { pending: 0, rejected: 0, retrying: 0 });
  });
});
