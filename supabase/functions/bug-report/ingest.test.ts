import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  MAX_ERRORS_PER_DAY,
  MAX_ERRORS_PER_DAY_ALL_DEVICES,
  MAX_REPORTS_PER_DAY,
  MAX_REPORTS_PER_DAY_ALL_DEVICES,
  type IngestStore,
} from './handlers.ts';
import { MAX_BODY_BYTES, route } from './router.ts';
import type { Json } from './validate.ts';

/**
 * The bug-report ingest, end to end through `route`, over an in-memory store
 * (F-10). The function had no tests; it validates untrusted input and
 * enforces per-device limits, so those are what these pin.
 *
 * The store counts what it holds, like the tables do: `already` and
 * `alreadyAll` stand for rows sent earlier in the day, by this device and by
 * every device.
 */
class MemoryStore implements IngestStore {
  rows: { table: string; row: Json }[] = [];
  inbox: Parameters<IngestStore['fileInboxItem']>[0][] = [];
  already = 0;
  alreadyAll = 0;
  failCount = false;
  failInsert = false;
  failInbox = false;

  async countSince(table: string, deviceId: string | null): Promise<number | null> {
    if (this.failCount) return null;
    const held = this.rows.filter(
      (r) => r.table === table && (deviceId === null || r.row['device_id'] === deviceId),
    ).length;
    return held + (deviceId === null ? this.alreadyAll : this.already);
  }

  async insert(table: string, rows: readonly Json[]): Promise<boolean> {
    if (this.failInsert) return false;
    this.rows.push(...rows.map((row) => ({ table, row })));
    return true;
  }

  async fileInboxItem(item: Parameters<IngestStore['fileInboxItem']>[0]): Promise<boolean> {
    if (this.failInbox) return false;
    this.inbox.push(item);
    return true;
  }
}

const NOW = Date.parse('2026-09-17T12:00:00.000Z');
const event = (over: Json = {}) => ({
  errorName: 'TypeError',
  errorMessage: 'x is undefined',
  source: 'ui',
  deviceId: 'dev-1',
  occurredAt: '2026-09-17T11:59:00.000Z',
  ...over,
});
const report = (over: Json = {}) => ({
  description: 'No me deja cobrar',
  deviceId: 'dev-1',
  submittedAt: '2026-09-17T11:59:00.000Z',
  ...over,
});

async function send(path: string, body: unknown, store = new MemoryStore(), method = 'POST') {
  const init: RequestInit = method === 'POST' ? { method, body: JSON.stringify(body) } : { method };
  const res = await route(
    new Request(`https://fn/bug-report/${path}`, init),
    () => store,
    () => NOW,
  );
  return { status: res.status, body: (await res.json().catch(() => null)) as Json | null, store };
}

describe('POST /errors', () => {
  it('stores valid events as snake_case rows with a fingerprint, and drops the stack', async () => {
    const { status, body, store } = await send('errors', {
      entries: [event({ context: { screen: 'Ventas', errorStack: 'at /app/x.js' } })],
    });
    assert.equal(status, 201);
    assert.deepEqual(body, { accepted: 1 });
    const row = store.rows[0]?.row ?? {};
    assert.equal(row['error_name'], 'TypeError');
    assert.equal(row['business_id'], null);
    assert.match(String(row['fingerprint']), /^[0-9a-f]{64}$/);
    assert.deepEqual(row['context'], { screen: 'Ventas' });
  });

  it('refuses an empty batch, an oversized batch, and a batch with nothing valid', async () => {
    assert.equal((await send('errors', { entries: [] })).status, 400);
    assert.equal((await send('errors', { entries: Array(51).fill(event()) })).status, 400);
    assert.equal((await send('errors', { entries: [event({ source: 'mars' })] })).status, 400);
  });

  it('keeps the valid entries of a mixed batch', async () => {
    const { body } = await send('errors', { entries: [event(), event({ deviceId: '' })] });
    assert.deepEqual(body, { accepted: 1 });
  });

  it('enforces the per-device daily limit', async () => {
    const store = new MemoryStore();
    store.already = MAX_ERRORS_PER_DAY;
    assert.equal((await send('errors', { entries: [event()] }, store)).status, 429);
  });

  it('answers 500 when the insert fails', async () => {
    const store = new MemoryStore();
    store.failInsert = true;
    assert.equal((await send('errors', { entries: [event()] }, store)).status, 500);
  });

  it('fails closed: a count that cannot be made refuses the batch, it is not read as zero', async () => {
    const store = new MemoryStore();
    store.failCount = true;
    const { status, body } = await send('errors', { entries: [event()] }, store);
    assert.equal(status, 503);
    assert.deepEqual(body, { error: 'Rate limit unavailable, try later' });
    assert.equal(store.rows.length, 0);
  });

  it('holds a daily ceiling across every device, whatever deviceId the caller picks', async () => {
    const store = new MemoryStore();
    store.alreadyAll = MAX_ERRORS_PER_DAY_ALL_DEVICES - 1;
    const fresh = (n: number) => event({ deviceId: `nunca-visto-${n}` });
    assert.equal((await send('errors', { entries: [fresh(1), fresh(2)] }, store)).status, 429);
    assert.equal(store.rows.length, 0, 'a batch that would cross the ceiling stores nothing');
    assert.equal((await send('errors', { entries: [fresh(3)] }, store)).status, 201);
    assert.equal((await send('errors', { entries: [fresh(4)] }, store)).status, 429);
  });
});

describe('POST /bug-reports', () => {
  it('stores a valid report, trimmed', async () => {
    const { status, store } = await send('bug-reports', report({ description: 'a'.repeat(6000) }));
    assert.equal(status, 201);
    assert.equal(String(store.rows[0]?.row['description']).length, 5000);
  });

  it('files every stored report in the staff inbox too (N-08), and 502s when the console refuses', async () => {
    const { store } = await send('bug-reports', report());
    assert.equal(store.inbox.length, 1);
    assert.match(store.inbox[0]?.title ?? '', /^Reporte del teléfono dev-1/);
    assert.match(store.inbox[0]?.body ?? '', /No me deja cobrar/);
    assert.equal(store.inbox[0]?.sourceRef, 'bug-report:dev-1:2026-09-17T11:59:00.000Z');

    const failing = new MemoryStore();
    failing.failInbox = true;
    const refused = await send('bug-reports', report(), failing);
    assert.equal(refused.status, 502);
    assert.equal(failing.rows.length, 1, 'the attempt is counted before anything is filed');
  });

  it('fails closed: a count that cannot be made files nothing', async () => {
    const store = new MemoryStore();
    store.failCount = true;
    const { status, body } = await send('bug-reports', report(), store);
    assert.equal(status, 503);
    assert.deepEqual(body, { error: 'Rate limit unavailable, try later' });
    assert.deepEqual([store.inbox.length, store.rows.length], [0, 0]);
  });

  it('fails closed: a report the counter cannot record is not filed either', async () => {
    // Otherwise a payload the table refuses would reach the inbox uncounted, without end.
    const store = new MemoryStore();
    store.failInsert = true;
    assert.equal((await send('bug-reports', report(), store)).status, 503);
    assert.equal(store.inbox.length, 0);
  });

  it('a caller rotating deviceId cannot file past the daily ceiling for all devices', async () => {
    const store = new MemoryStore();
    store.alreadyAll = MAX_REPORTS_PER_DAY_ALL_DEVICES - 3;
    const statuses: number[] = [];
    for (let n = 0; n < 6; n += 1) {
      statuses.push((await send('bug-reports', report({ deviceId: `rotado-${n}` }), store)).status);
    }
    assert.deepEqual(statuses, [201, 201, 201, 429, 429, 429]);
    assert.equal(store.inbox.length, 3, 'the staff inbox receives the ceiling and no more');
  });

  it('refuses a report without a description, device or date, and past the daily limit', async () => {
    assert.equal((await send('bug-reports', report({ description: '' }))).status, 400);
    assert.equal((await send('bug-reports', report({ deviceId: 7 }))).status, 400);
    assert.equal((await send('bug-reports', report({ submittedAt: 'ayer' }))).status, 400);
    const store = new MemoryStore();
    store.already = MAX_REPORTS_PER_DAY;
    assert.equal((await send('bug-reports', report(), store)).status, 429);
  });
});

describe('the request pipeline', () => {
  it('answers CORS preflight, refuses other methods, bad JSON, big bodies and unknown paths', async () => {
    assert.equal((await send('errors', null, undefined, 'OPTIONS')).status, 200);
    assert.equal((await send('errors', null, undefined, 'GET')).status, 405);
    const bad = await route(
      new Request('https://fn/bug-report/errors', { method: 'POST', body: '{' }),
      () => new MemoryStore(),
    );
    assert.equal(bad.status, 400);
    assert.equal((await send('errors', { pad: 'x'.repeat(MAX_BODY_BYTES) })).status, 413);
    assert.equal((await send('elsewhere', {})).status, 404);
  });
});
