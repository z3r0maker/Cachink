/**
 * C-24 — product photos over the wire (ADR-134), against the mock and the
 * portal alike: a phone pushes a photo row and it flows back on the pull; an
 * update is refused as HYBRID_UPDATE_FORBIDDEN; a photo past the entity's
 * 40 KB fails the schema (the device never sends one); a tombstone inserts like any row; and a snapshot carries only
 * the newest photo per product.
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

const WEBP = Buffer.from('RIFF....WEBPVP8 ', 'latin1').toString('base64');
const ids = [
  '01HZ8XQN9GZJXV8AKQ5X0C24P1',
  '01HZ8XQN9GZJXV8AKQ5X0C24P2',
  '01HZ8XQN9GZJXV8AKQ5X0C24P3',
];

function image(id: string, at: string, bytes: string | null = WEBP, product = 0) {
  const productoId = act.bootstrap.tables.products[product]?.id;
  if (!productoId) throw new Error('the tenant has no products');
  return {
    id,
    productoId,
    mime: 'image/webp',
    bytes,
    width: bytes === null ? null : 512,
    height: bytes === null ? null : 512,
    businessId: act.businessId,
    deviceId: act.deviceId,
    createdByUserId: null,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
  };
}
const delta = (
  row: Record<string, unknown>,
  clientSeq: number,
  op: 'insert' | 'update' = 'insert',
) => ({
  table: 'product_images',
  rowId: String(row['id']),
  op,
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

describe('product_images (C-24)', () => {
  it('a pushed photo flows back on the pull and an update is refused per row', async () => {
    const first = image(ids[0] as string, '2026-11-03T10:00:00.000Z');
    const res = await push([delta(first, 1), delta({ ...first, width: 400 }, 2, 'update')]);
    assert.deepEqual(
      res.accepted.map((a) => a.rowId),
      [ids[0]],
    );
    const codes = Object.fromEntries(res.rejected.map((r) => [r.rowId, r.code]));
    assert.equal(codes[ids[0] as string], 'HYBRID_UPDATE_FORBIDDEN');

    const back = await pull(`since=${act.bootstrap.serverSeq}`);
    const mine = back.tables.product_images.find((p) => p.id === ids[0]);
    assert.ok(mine, 'the photo came back on the pull');
    assert.equal(mine.bytes, WEBP);
    assert.equal(mine.width, 512);
  });

  it('a photo over 40 KB never passes the schema: the batch is refused, as the device refuses it before sending', async () => {
    const big = {
      ...image(ids[2] as string, '2026-11-03T10:00:00.000Z'),
      bytes: Buffer.alloc(40_961, 1).toString('base64'),
    };
    const r = await pushRaw([delta(big, 3)]);
    assert.equal(r.status, 400, JSON.stringify(r.body));
    assert.equal((r.body as { error: { code: string } }).error.code, 'VALIDATION');
  });

  it('a tombstone inserts like any row and a snapshot sends only the newest photo per product', async () => {
    const tomb = image(ids[1] as string, '2026-11-03T11:00:00.000Z', null);
    const res = await push([delta(tomb, 4)]);
    assert.deepEqual(
      res.accepted.map((a) => a.rowId),
      [ids[1]],
    );

    // Product 0 now ends in a tombstone (no photo); product 1 gets a photo.
    const later = image('01HZ8XQN9GZJXV8AKQ5X0C24P4', '2026-11-03T12:00:00.000Z', WEBP, 1);
    await push([delta(later, 5)]);

    const pages = [await pull('since=0&snapshot=start')];
    for (let next = pages[0]?.snapshot?.next; next; next = pages.at(-1)?.snapshot?.next) {
      pages.push(await pull(`since=0&snapshot=${encodeURIComponent(next)}`));
      assert.ok(pages.length < 100, 'the snapshot ends');
    }
    const photos = pages.flatMap((p) => p.tables.product_images);
    const byProduct = new Map(photos.map((p) => [p.productoId, p]));
    assert.equal(byProduct.get(later.productoId)?.id, later.id, 'product 1 has its one photo');
    assert.equal(
      byProduct.has(tomb.productoId),
      false,
      'a product whose newest row is a tombstone sends nothing',
    );
    assert.equal(photos.length, byProduct.size, 'one row per product');
  });
});
