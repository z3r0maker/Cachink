/**
 * DB2-DEV-01: rows retried inside a batch that fails as a whole must never be
 * stranded as `pending` (on the caja, cierre waits for `pending === 0`), and
 * a slice plus its retries must never exceed the server's per-push limit.
 */

import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { MAX_PUSH_DELTAS, type Delta } from '@xangarro/contracts';
import { startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import { ApiClient } from '../src/api-client.js';
import { drainPush, pauseAfter } from '../src/push.js';
import { STALE_PENDING_MS, StatusStore, backoffMs } from '../src/status-store.js';
import { activatedDevice, pushDeps, ringSale, type Device } from './helpers/device.js';

let mock: RunningMock;
beforeAll(async () => {
  mock = await startMockServer(0);
});
afterAll(async () => {
  await mock.close();
});

/** Records the size of every push it forwards to the mock. */
class RecordingClient extends ApiClient {
  readonly sizes: number[] = [];
  override push(token: string, deltas: readonly Delta[]) {
    this.sizes.push(deltas.length);
    return super.push(token, deltas);
  }
}

const unavailable = (): ApiClient =>
  new ApiClient({
    baseUrl: 'http://x',
    fetchImpl: (async () =>
      new Response(JSON.stringify({ error: { code: 'INTERNAL', message: 'caído' } }), {
        status: 503,
      })) as typeof fetch,
  });

const t0 = new Date('2026-09-16T23:00:00.000Z');
const at = (ms: number): Date => new Date(t0.getTime() + ms);

/** 12 sales under the flaky scenario: some rows come back retryable at t0. */
async function withRetries(d: Device): Promise<number> {
  for (let i = 0; i < 12; i += 1) await ringSale(d);
  const flaky = await drainPush(
    pushDeps(d, mock.url, { now: t0, headers: { 'X-Mock-Scenario': 'flaky' } }),
  );
  assert.ok(flaky.rejected > 0, 'the flaky scenario should reject some rows');
  return flaky.rejected;
}

describe('drainPush · retries inside a failed batch (DB2-DEV-01)', () => {
  let d: Device;
  beforeEach(async () => {
    d = await activatedDevice(mock.url);
  });

  it('puts the retries back to rejected when the batch fails as a whole, and resends them later', async () => {
    const retried = await withRetries(d);
    const t1 = at(backoffMs(1) + 1);
    const failed = await drainPush(pushDeps(d, mock.url, { now: t1, client: unavailable() }));
    assert.equal(failed.error?.code, 'INTERNAL');
    const store = new StatusStore(d.db);
    assert.deepEqual(await store.countByStatus(), { pending: 0, rejected: 0, retrying: retried });
    const tooSoon = await drainPush(pushDeps(d, mock.url, { now: at(backoffMs(1) + 2_000) }));
    assert.equal(tooSoon.batches, 0, 'a failed retry waits for its next backoff');
    const later = new Date(t1.getTime() + backoffMs(2) + 1);
    const resent = await drainPush(pushDeps(d, mock.url, { now: later }));
    assert.deepEqual([resent.accepted, resent.error], [retried, null]);
    assert.deepEqual(await store.countByStatus(), { pending: 0, rejected: 0, retrying: 0 });
  });

  it('keeps a full slice plus its retries within the server limit', async () => {
    const retried = await withRetries(d);
    for (let i = 0; i < MAX_PUSH_DELTAS / 2; i += 1) await ringSale(d);
    const client = new RecordingClient({ baseUrl: mock.url });
    const out = await drainPush(pushDeps(d, mock.url, { now: at(backoffMs(1) + 1), client }));
    assert.equal(out.error, null);
    assert.ok(Math.max(...client.sizes) <= MAX_PUSH_DELTAS, `sizes ${client.sizes.join(',')}`);
    assert.equal(out.accepted, MAX_PUSH_DELTAS + retried);
    const counts = await new StatusStore(d.db).countByStatus();
    assert.deepEqual(counts, { pending: 0, rejected: 0, retrying: 0 });
  });

  it('honours a smaller batch limit and still drains the backlog', async () => {
    const retried = await withRetries(d);
    for (let i = 0; i < 5; i += 1) await ringSale(d);
    const client = new RecordingClient({ baseUrl: mock.url });
    const deps = { ...pushDeps(d, mock.url, { now: at(backoffMs(1) + 1), client }), batchLimit: 4 };
    const out = await drainPush(deps, 50);
    assert.ok(Math.max(...client.sizes) <= 4, `sizes ${client.sizes.join(',')}`);
    assert.deepEqual([out.accepted, out.error], [10 + retried, null]);
  });

  it('recovers rows left pending by a push that never answered (crash, closed tab)', async () => {
    const retried = await withRetries(d);
    const store = new StatusStore(d.db);
    const t1 = at(backoffMs(1) + 1);
    // What sendBatch does right before the request that never came back.
    await store.markPending(await store.dueRetries(t1, 100), t1.toISOString());
    assert.equal((await store.countByStatus()).pending, retried);
    const inFlight = await drainPush(pushDeps(d, mock.url, { now: at(backoffMs(1) + 5_000) }));
    assert.equal(inFlight.batches, 0, 'a recent pending row may still be in flight');
    const stale = new Date(t1.getTime() + STALE_PENDING_MS + 1);
    const recovered = await drainPush(pushDeps(d, mock.url, { now: stale }));
    assert.deepEqual([recovered.accepted, recovered.error], [retried, null]);
    assert.deepEqual(await store.countByStatus(), { pending: 0, rejected: 0, retrying: 0 });
  });
});

describe('drainPush · pacing a long backlog (DB2-DEV-02)', () => {
  it('paces between batches, never after the last one', async () => {
    const d = await activatedDevice(mock.url);
    for (let i = 0; i < 3; i += 1) await ringSale(d);
    const paced: number[] = [];
    const deps = {
      ...pushDeps(d, mock.url),
      batchLimit: 2,
      pace: async (elapsedMs: number) => {
        paced.push(elapsedMs);
      },
    };
    const out = await drainPush(deps);
    assert.deepEqual([out.batches, out.accepted, paced.length], [3, 6, 2]);
  });

  it('pauses only after a slow answer, as long as it took, up to 10 s', () => {
    assert.equal(pauseAfter(300), 0);
    assert.equal(pauseAfter(2_500), 2_500);
    assert.equal(pauseAfter(45_000), 10_000);
  });
});

describe('StatusStore · jittered row backoff (DB2-DEV-02)', () => {
  it('spreads a retry between half and all of its backoff', async () => {
    const d = await activatedDevice(mock.url);
    const now = at(0);
    const rej = { code: 'INTERNAL', message: 'x', retryable: true };
    await new StatusStore(d.db, { random: () => 0 }).markRejected('sales', 'A', rej, now);
    await new StatusStore(d.db, { random: () => 1 }).markRejected('sales', 'B', rej, now);
    const due = async (ms: number) =>
      (await new StatusStore(d.db).dueRetries(at(ms), 10)).map((c) => c.rowId).sort();
    assert.deepEqual(await due(backoffMs(1) / 2 - 1), []);
    assert.deepEqual(await due(backoffMs(1) / 2), ['A']);
    assert.deepEqual(await due(backoffMs(1)), ['A', 'B']);
  });
});
