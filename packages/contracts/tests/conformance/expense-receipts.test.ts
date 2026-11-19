/**
 * M-18 — a gasto's receipt photo over the wire (ADR-149), against the mock and
 * the portal alike: a phone pushes a receipt row and it is accepted; it never
 * comes back on the pull nor in a snapshot, since no other phone shows it; a
 * re-push of the same row is idempotent; and a receipt past 96 KB fails the
 * schema (the device never sends one).
 */

import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ActivateResponseSchema, type ActivateResponse } from '../../src/activate.js';
import { PullResponseSchema, type PullResponse } from '../../src/sync-pull.js';
import { PushResponseSchema } from '../../src/sync-push.js';
import { API_PATHS } from '../../src/transport.js';
import { encodeJson } from '../../src/wire.js';
import { DEVICE, call, startHarness, type Harness } from './setup.js';

let h: Harness;
let act: ActivateResponse;

beforeAll(async () => {
  h = await startHarness();
  const r = await call(h.base, 'POST', API_PATHS.activate, {
    body: { email: h.email, code: await h.freshCode(), device: DEVICE },
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  act = ActivateResponseSchema.parse(r.body);
});
afterAll(async () => {
  await h.close();
});

const WEBP = Buffer.from('RIFF....WEBPVP8 ticket', 'latin1').toString('base64');
const GASTO = '01HZ8XQN9GZJXV8AKQ5X0M18G1';
const ids = ['01HZ8XQN9GZJXV8AKQ5X0M18R1', '01HZ8XQN9GZJXV8AKQ5X0M18R2'];

function receipt(id: string, at: string, bytes: string = WEBP) {
  return {
    id,
    gastoId: GASTO,
    mime: 'image/webp',
    bytes,
    width: 768,
    height: 1024,
    businessId: act.businessId,
    deviceId: act.deviceId,
    createdByUserId: null,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
  };
}
const delta = (row: Record<string, unknown>, clientSeq: number) => ({
  table: 'expense_receipts',
  rowId: String(row['id']),
  op: 'insert' as const,
  clientSeq,
  row,
});
const pushRaw = (deltas: unknown[]) =>
  call(h.base, 'POST', API_PATHS.syncPush, {
    token: act.deviceToken,
    body: JSON.parse(encodeJson({ deltas })),
  });
const push = async (deltas: unknown[]) => {
  const r = await pushRaw(deltas);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return PushResponseSchema.parse(r.body);
};
const pull = async (query: string): Promise<PullResponse> => {
  const r = await call(h.base, 'GET', `${API_PATHS.syncPull}?${query}`, { token: act.deviceToken });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return PullResponseSchema.parse(r.body);
};

describe('expense_receipts (M-18)', () => {
  it('a pushed receipt is accepted, and a re-push of it answers the same serverSeq', async () => {
    const first = receipt(ids[0] as string, '2026-11-19T16:05:00.000Z');
    const res = await push([delta(first, 1)]);
    assert.deepEqual(res.rejected, []);
    assert.deepEqual(
      res.accepted.map((a) => a.rowId),
      [ids[0]],
    );
    const again = await push([delta(first, 1)]);
    assert.equal(again.accepted[0]?.serverSeq, res.accepted[0]?.serverSeq);
  });

  it('never comes back on the pull nor in a snapshot', async () => {
    const back = await pull(`since=${act.bootstrap.serverSeq}`);
    assert.equal('expense_receipts' in back.tables, false, 'the pull has no receipts');
    const pages = [await pull('since=0&snapshot=start')];
    for (let next = pages[0]?.snapshot?.next; next; next = pages.at(-1)?.snapshot?.next) {
      pages.push(await pull(`since=0&snapshot=${encodeURIComponent(next)}`));
      assert.ok(pages.length < 100, 'the snapshot ends');
    }
    for (const p of pages) assert.equal('expense_receipts' in p.tables, false);
    assert.equal('expense_receipts' in act.bootstrap.tables, false, 'nor the bootstrap');
  });

  it('a receipt over 96 KB never passes the schema: the batch is refused, as the device refuses it before sending', async () => {
    const big = receipt(
      ids[1] as string,
      '2026-11-19T16:10:00.000Z',
      Buffer.alloc(98_305, 1).toString('base64'),
    );
    const r = await pushRaw([delta(big, 2)]);
    assert.equal(r.status, 400, JSON.stringify(r.body));
    assert.equal((r.body as { error: { code: string } }).error.code, 'VALIDATION');
  });
});
