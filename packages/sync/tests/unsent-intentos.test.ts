/**
 * DS-07: Registros por enviar says, per row in retry, when it was last tried
 * and when it goes again («Último intento: hace 3 min · Próximo: en 2 min»).
 * The times were already on `__sync_row_status`; `unsentRows` now returns them.
 */

import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { and, eq } from 'drizzle-orm';
import { syncRowStatus } from '@xangarro/data';
import { startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import { ApiClient } from '../src/api-client.js';
import { drainPush } from '../src/push.js';
import { StatusStore, STALE_PENDING_MS } from '../src/status-store.js';
import { unsentRows } from '../src/unsent.js';
import { activatedDevice, pushDeps, ringSale, type Device } from './helpers/device.js';

let mock: RunningMock;
beforeAll(async () => {
  mock = await startMockServer(0);
});
afterAll(async () => {
  await mock.close();
});

const t0 = new Date('2026-09-16T23:00:00.000Z');
const offline = (): ApiClient =>
  new ApiClient({
    baseUrl: 'http://x',
    fetchImpl: (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch,
  });

describe('unsentRows · when a row was tried and goes again (DS-07)', () => {
  let d: Device;
  let store: StatusStore;
  beforeEach(async () => {
    d = await activatedDevice(mock.url);
    store = new StatusStore(d.db, { random: () => 0.5 });
  });

  const fila = async (rowId: string) => {
    const r = (await unsentRows(d.db)).find((u) => u.rowId === rowId);
    assert.ok(r, `${rowId} is unsent`);
    return r;
  };

  it('a capture never tried has neither time', async () => {
    const saleId = await ringSale(d);
    const r = await fila(saleId);
    assert.equal(r.retrying, false);
    assert.equal(r.lastAttemptAt, null);
    assert.equal(r.nextAttemptAt, null);
  });

  it('a row in flight goes again when the stale sweep picks it up, ten minutes on', async () => {
    const saleId = await ringSale(d);
    await store.markPending([{ tableName: 'sales', rowId: saleId } as never], t0.toISOString());
    const r = await fila(saleId);
    assert.equal(r.lastAttemptAt, t0.toISOString());
    assert.equal(r.nextAttemptAt, new Date(t0.getTime() + STALE_PENDING_MS).toISOString());
  });

  it('a retryable rejection goes again at its own backoff', async () => {
    const saleId = await ringSale(d);
    await store.markPending([{ tableName: 'sales', rowId: saleId } as never], t0.toISOString());
    await store.markRejected(
      'sales',
      saleId,
      { code: 'INTERNAL', message: 'x', retryable: true },
      t0,
    );
    const [row] = await d.db
      .select({ retryAfter: syncRowStatus.retryAfter })
      .from(syncRowStatus)
      .where(and(eq(syncRowStatus.tableName, 'sales'), eq(syncRowStatus.rowId, saleId)))
      .all();
    const r = await fila(saleId);
    assert.equal(r.lastAttemptAt, t0.toISOString(), 'the attempt that was refused');
    assert.ok(row?.retryAfter, 'the store scheduled it');
    assert.equal(r.nextAttemptAt, row.retryAfter);
    assert.ok(Date.parse(r.nextAttemptAt ?? '') > t0.getTime());
  });

  it('a push that fails as a whole gives every row its attempt and a time to go again', async () => {
    await ringSale(d);
    const failed = await drainPush(pushDeps(d, mock.url, { now: t0, client: offline() }));
    assert.notEqual(failed.error, null);
    const rows = await unsentRows(d.db);
    assert.equal(rows.length, 2, 'the ticket and its line');
    for (const r of rows) {
      assert.equal(r.lastAttemptAt, t0.toISOString(), r.tableName);
      assert.ok(Date.parse(r.nextAttemptAt ?? '') > t0.getTime(), r.tableName);
    }
  });
});
