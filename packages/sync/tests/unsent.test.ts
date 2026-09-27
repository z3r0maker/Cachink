/**
 * DB3-CAJA-02: one definition of «unsent» — everything the server has not
 * accepted yet — for the caja's pill, Registros por enviar and cierre, and the
 * phone's pill. Offline captures (no status row at all) count; rows from a
 * failed push count once, as retrying; terminal rejections stay apart.
 */

import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import { ApiClient } from '../src/api-client.js';
import { drainPush } from '../src/push.js';
import { StatusStore } from '../src/status-store.js';
import { unsentRows } from '../src/unsent.js';
import { activatedDevice, pushDeps, ringSale, type Device } from './helpers/device.js';

let mock: RunningMock;
beforeAll(async () => {
  mock = await startMockServer(0);
});
afterAll(async () => {
  await mock.close();
});

const offline = (): ApiClient =>
  new ApiClient({
    baseUrl: 'http://x',
    fetchImpl: (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch,
  });

const t0 = new Date('2026-09-16T23:00:00.000Z');

describe('unsentRows · one definition of «por enviar» (DB3-CAJA-02)', () => {
  let d: Device;
  let store: StatusStore;
  beforeEach(async () => {
    d = await activatedDevice(mock.url);
    store = new StatusStore(d.db);
  });

  it('counts sales captured offline, which have no status row yet', async () => {
    await ringSale(d);
    await ringSale(d);
    await ringSale(d);
    const rows = await unsentRows(d.db);
    assert.equal(rows.length, 6, 'three tickets and their three lines');
    assert.ok(rows.every((r) => !r.retrying));
    assert.equal(await store.unsentCount(), 6);
    assert.deepEqual(await store.countByStatus(), { pending: 0, rejected: 0, retrying: 0 });
  });

  it('counts the rows of a failed push once each, as retrying', async () => {
    await ringSale(d);
    await ringSale(d);
    const failed = await drainPush(pushDeps(d, mock.url, { now: t0, client: offline() }));
    assert.notEqual(failed.error, null);
    const rows = await unsentRows(d.db);
    assert.equal(rows.length, 4, 'in the change log and pending, still counted once');
    assert.ok(rows.every((r) => r.retrying));
  });

  it('drops accepted rows, and keeps a terminal rejection out of the queue', async () => {
    const saleId = await ringSale(d);
    await ringSale(d);
    const ok = await drainPush(pushDeps(d, mock.url, { now: t0 }));
    assert.equal(ok.error, null);
    assert.equal(await store.unsentCount(), 0, 'everything accepted: nothing to send');
    await store.markRejected(
      'sales',
      saleId,
      { code: 'VALIDATION', message: 'mal', retryable: false },
      t0,
    );
    assert.equal(
      await store.unsentCount(),
      0,
      'a terminal rejection needs a person, not the queue',
    );
    assert.equal((await store.countByStatus()).rejected, 1);
  });

  it('counts a retryable rejection as retrying, and lists retries before new captures', async () => {
    const first = await ringSale(d);
    await drainPush(pushDeps(d, mock.url, { now: t0 }));
    await store.markRejected(
      'sales',
      first,
      { code: 'INTERNAL', message: 'x', retryable: true },
      t0,
    );
    await ringSale(d);
    const rows = await unsentRows(d.db);
    assert.deepEqual(
      rows.map((r) => r.retrying),
      [true, false, false],
    );
    assert.equal(rows[0]?.rowId, first);
  });

  it('stops at the scan limit instead of reading an unbounded backlog', async () => {
    for (let i = 0; i < 4; i += 1) await ringSale(d);
    assert.equal((await unsentRows(d.db, 3)).length, 3);
  });
});
