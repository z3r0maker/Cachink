/**
 * DB3-SYNC-01 (b): a batch the server refuses as a whole — a 400 from a
 * stricter schema, a 413, a 500 that repeats — must not block the outbox.
 * The batch is halved down to the row at fault, which is kept locally as
 * refused, and everything else goes. Outages and rate limits never split.
 */

import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';
import { MAX_PUSH_DELTAS } from '@xangarro/contracts';
import { startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import { drainPush } from '../src/push.js';
import { fitBody, type Prepared } from '../src/push-batch.js';
import { SERVER_REFUSED, refusalOf } from '../src/push-split.js';
import { StatusStore } from '../src/status-store.js';
import { SYNC_CONFIG_KEYS } from '../src/sync-keys.js';
import { GateClient, refusal, type Gate } from './helpers/gate-client.js';
import { activatedDevice, pushDeps, ringSale, type Device } from './helpers/device.js';

let mock: RunningMock;
beforeAll(async () => {
  mock = await startMockServer(0);
});
afterAll(async () => {
  await mock.close();
});

const LOG = Math.ceil(Math.log2(MAX_PUSH_DELTAS));

async function backlog(sales: number): Promise<Device> {
  const d = await activatedDevice(mock.url);
  for (let i = 0; i < sales; i += 1) await ringSale(d);
  return d;
}

/** Poisons the row at `pos` of the first push: every batch carrying it is refused with `status`. */
function poisonAt(pos: number, status: number): { poison: Set<string>; gate: Gate } {
  const poison = new Set<string>();
  const gate: Gate = (deltas, n) => {
    if (n === 1) poison.add(deltas[pos]!.rowId);
    return deltas.some((x) => poison.has(x.rowId)) ? refusal(status) : null;
  };
  return { poison, gate };
}

const drain = (d: Device, client: GateClient) => drainPush(pushDeps(d, mock.url, { client }));

async function hwm(d: Device): Promise<number> {
  const deps = pushDeps(d, mock.url);
  return Number((await deps.appConfig.get(SYNC_CONFIG_KEYS.pushHwm)) ?? '0');
}

async function logRows(d: Device, upTo = Number.MAX_SAFE_INTEGER): Promise<Set<string>> {
  const rows = (await d.db.all(
    sql`SELECT row_id AS rowId FROM __xangarro_change_log WHERE id <= ${upTo}`,
  )) as { rowId: string }[];
  return new Set(rows.map((r) => r.rowId));
}

async function maxLogId(d: Device): Promise<number> {
  const [row] = (await d.db.all(sql`SELECT max(id) AS id FROM __xangarro_change_log`)) as {
    id: number;
  }[];
  return row?.id ?? 0;
}

async function refused(d: Device) {
  return (await new StatusStore(d.db).listRejected(10)).map((r) => [r.rowId, r.code, r.retryable]);
}

describe('drainPush · a batch refused as a whole (DB3-SYNC-01 b)', () => {
  for (const pos of [0, 137, 499]) {
    it(`isolates a poison row at ${pos} of a 500-row batch in ≤ log2(500)+1 extra requests`, async () => {
      const d = await backlog(MAX_PUSH_DELTAS / 2);
      const { poison, gate } = poisonAt(pos, 400);
      const client = new GateClient(mock.url, gate);
      const out = await drain(d, client);
      const [bad] = [...poison];
      assert.equal(client.sizes[0], MAX_PUSH_DELTAS);
      const lastWithPoison = client.batches.findLastIndex((b) => b.includes(bad!));
      assert.ok(lastWithPoison <= LOG + 1, `isolated after ${lastWithPoison} extra requests`);
      assert.ok(client.batches.length <= LOG + 3, `sizes ${client.sizes.join(',')}`);
      assert.deepEqual([out.error, out.accepted, out.rejected], [null, 499, 1]);
      assert.equal(client.accepted.size, 499);
      assert.equal(client.accepted.has(bad!), false);
      assert.deepEqual(await refused(d), [[bad, SERVER_REFUSED, false]]);
      assert.equal(await hwm(d), await maxLogId(d));
      const again = await drain(d, client);
      assert.equal(again.batches, 0, 'a refused row is not sent again on its own');
    });
  }

  it('isolates a row the server answers 413 for, and says so', async () => {
    const d = await backlog(20);
    const { poison, gate } = poisonAt(11, 413);
    const client = new GateClient(mock.url, gate);
    const out = await drain(d, client);
    assert.deepEqual([out.error, out.accepted], [null, 39]);
    const [entry] = await new StatusStore(d.db).listRejected(10);
    assert.deepEqual([entry?.rowId, entry?.code], [[...poison][0], SERVER_REFUSED]);
    assert.match(entry?.message ?? '', /413/);
  });

  it('splits on a 500 only when the same first batch failed three times running', async () => {
    const d = await backlog(5);
    const { poison, gate } = poisonAt(3, 500);
    const client = new GateClient(mock.url, gate);
    for (let i = 0; i < 2; i += 1) {
      const out = await drain(d, client);
      assert.deepEqual(
        [out.error?.status, client.batches.length, await refused(d)],
        [500, i + 1, []],
      );
    }
    const third = await drain(d, client);
    assert.deepEqual([third.error, third.accepted], [null, 9]);
    assert.deepEqual(await refused(d), [[[...poison][0], SERVER_REFUSED, false]]);
  });

  it('never splits on an outage or a rate limit', async () => {
    const waits = [
      refusal(503, { retryAfterMs: 15_000 }),
      refusal(503),
      refusal(429, { retryAfterMs: 7_000 }),
      refusal(500, { retryAfterMs: 15_000 }),
      refusal(0, { code: 'NETWORK' }),
      refusal(0, { code: 'TIMEOUT' }),
    ];
    for (const answer of waits) {
      const d = await backlog(5);
      const client = new GateClient(mock.url, () => answer);
      for (let i = 0; i < 4; i += 1) await drain(d, client);
      assert.deepEqual(client.sizes, [10, 10, 10, 10], `${answer.status} ${answer.code}`);
      assert.deepEqual([await refused(d), await hwm(d)], [[], 0]);
    }
  });

  it('refuses nothing when the server refuses every row alike (a stricter schema)', async () => {
    const d = await backlog(40);
    const client = new GateClient(mock.url, () => refusal(400));
    const out = await drain(d, client);
    assert.deepEqual([out.error?.status, out.accepted], [400, 0]);
    assert.ok(client.batches.length <= LOG + 3, `sizes ${client.sizes.join(',')}`);
    assert.deepEqual([await refused(d), await hwm(d)], [[], 0]);
  });

  it('never moves the high-water mark past a good row a broken split left unsent', async () => {
    const d = await backlog(MAX_PUSH_DELTAS / 2);
    const { poison, gate } = poisonAt(300, 400);
    const outage: Gate = (deltas, n) => (n > 4 ? refusal(503) : gate(deltas, n));
    const client = new GateClient(mock.url, outage);
    const broken = await drain(d, client);
    assert.equal(broken.error?.status, 503);
    const mark = await hwm(d);
    assert.ok(mark > 0, 'the rows accepted before the outage are behind the mark');
    for (const id of await logRows(d, mark))
      if (client.seen.has(id)) assert.ok(client.accepted.has(id), `${id} is behind the mark`);
    client.gate = gate;
    const healed = await drain(d, client);
    assert.equal(healed.error, null);
    for (const id of client.seen) assert.equal(client.accepted.has(id), !poison.has(id), id);
    assert.equal(await hwm(d), await maxLogId(d));
  });
});

describe('drainPush · rows too big to send (DB3-SYNC-01 b)', () => {
  it('refuses an oversized row locally and never sends it', async () => {
    const d = await backlog(2);
    const big = '01JPRD000000000000000000BG';
    const atributos = JSON.stringify({ nota: 'x'.repeat(20_000) });
    await d.db.run(sql`CREATE TEMP TABLE p AS SELECT * FROM products WHERE id = ${d.productId}`);
    await d.db.run(sql`UPDATE p SET id = ${big}, sku = NULL, atributos = ${atributos}`);
    await d.db.run(sql`INSERT INTO products SELECT * FROM p`);
    const client = new GateClient(mock.url, () => null);
    const out = await drain(d, client);
    assert.deepEqual([out.error, out.accepted], [null, 4]);
    assert.equal(client.seen.has(big), false);
    const [entry] = await new StatusStore(d.db).listRejected(10);
    assert.deepEqual([entry?.rowId, entry?.code, entry?.retryable], [big, 'VALIDATION', false]);
  });
});

describe('fitBody · a push under the request limit', () => {
  const prepared = (sizes: number[]): Prepared => ({
    deltas: sizes.map((n, i) => ({ rowId: `R${i}`, row: { nota: 'x'.repeat(n) } }) as never),
    sent: sizes.map((_, i) => ({ tableName: 'sales', rowId: `R${i}`, op: 'insert' as const })),
  });

  it('keeps the longest prefix within the budget, and never less than one row', () => {
    const fits = (sizes: number[], max: number) => fitBody(prepared(sizes), max).sent.length;
    assert.equal(fits([100, 100, 100], 1_000), 3);
    assert.equal(fits([400, 400, 400], 1_000), 2);
    assert.equal(fits([5_000, 10], 1_000), 1);
  });
});

describe('refusalOf · which whole-batch failures are the batch own', () => {
  it('splits 400 and 413 now, other 5xx after strikes, never an outage or a wait', () => {
    const of = (status: number, retryAfterMs?: number) =>
      refusalOf({ code: 'X', status, ...(retryAfterMs === undefined ? {} : { retryAfterMs }) });
    assert.deepEqual(
      [of(400), of(413), of(500), of(502), of(504)],
      ['refused', 'refused', 'failed', 'failed', 'failed'],
    );
    assert.deepEqual(
      [of(503), of(429), of(0), of(401), of(426), of(500, 15_000)],
      [null, null, null, null, null, null],
    );
  });
});
