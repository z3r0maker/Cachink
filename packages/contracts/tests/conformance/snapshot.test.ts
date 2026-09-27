/**
 * C-23 — the snapshot bootstrap, against the mock and the portal alike: stock
 * from the baseline plus the recent movements equals stock from every
 * movement, pages chain to the end at one cursor, and a device pulls on from
 * that cursor.
 */

import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ActivateResponseSchema, type ActivateResponse } from '../../src/activate.js';
import { SNAPSHOT_MOVEMENT_WINDOW_DAYS, type StockBaselineRow } from '../../src/snapshot.js';
import { PullResponseSchema, type PullResponse } from '../../src/sync-pull.js';
import { API_PATHS } from '../../src/transport.js';
import { encodeJson } from '../../src/wire.js';
import { DEVICE, call, startHarness, type Harness } from './setup.js';

const DAY = 86_400_000;
let h: Harness;
let act: ActivateResponse;

beforeAll(async () => {
  h = await startHarness();
  const r = await call(h.base, 'POST', API_PATHS.activate, {
    body: { email: h.email, code: await h.freshCode(), device: DEVICE, bootstrap: 'snapshot' },
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  act = ActivateResponseSchema.parse(r.body);
});
afterAll(async () => {
  await h.close();
});

const pull = async (query: string): Promise<PullResponse> => {
  const r = await call(h.base, 'GET', `${API_PATHS.syncPull}?${query}`, { token: act.deviceToken });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return PullResponseSchema.parse(r.body);
};

/** Every page of a snapshot, from `start` to the page whose `next` is null. */
async function snapshotPages(): Promise<PullResponse[]> {
  const pages = [await pull('since=0&snapshot=start')];
  for (let next = pages[0]?.snapshot?.next; next; next = pages.at(-1)?.snapshot?.next) {
    pages.push(await pull(`since=0&snapshot=${encodeURIComponent(next)}`));
    assert.ok(pages.length < 500, 'the snapshot ends');
  }
  return pages;
}

type Movement = { productoId: string; tipo: string; cantidad: number; id: string };
const signed = (m: Movement) => (m.tipo === 'entrada' ? m.cantidad : -m.cantidad);

function stockOf(movements: readonly Movement[], baseline: readonly StockBaselineRow[] = []) {
  const stock = new Map<string, number>();
  for (const b of baseline) stock.set(b.productoId, (stock.get(b.productoId) ?? 0) + b.cantidad);
  for (const m of movements) stock.set(m.productoId, (stock.get(m.productoId) ?? 0) + signed(m));
  return new Map([...stock].filter(([, n]) => n !== 0));
}

function movement(id: string, daysAgo: number, tipo: 'entrada' | 'salida', cantidad: number) {
  const productoId = act.bootstrap.tables.products[0]?.id;
  if (!productoId) throw new Error('the tenant has no products');
  const at = new Date(Date.now() - daysAgo * DAY).toISOString();
  const row = {
    id,
    productoId,
    fecha: at.slice(0, 10),
    tipo,
    cantidad,
    costoUnitCentavos: 1000n,
    motivo: tipo === 'entrada' ? 'Compra a proveedor' : 'Merma / daño',
    nota: null,
    origen: 'manual',
    businessId: act.businessId,
    deviceId: act.deviceId,
    createdByUserId: null,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
  };
  return { table: 'inventory_movements', rowId: id, op: 'insert', clientSeq: daysAgo, row };
}

describe('snapshot bootstrap (C-23)', () => {
  it('activation embeds the first page: its cutoff, a baseline and the catalogue', () => {
    const s = act.bootstrap.snapshot;
    assert.ok(s, 'an opted-in activation carries snapshot info');
    assert.equal(s.first, true);
    const window = Date.now() - new Date(s.cutoff).getTime();
    assert.ok(Math.abs(window - SNAPSHOT_MOVEMENT_WINDOW_DAYS * DAY) < DAY, s.cutoff);
    assert.ok(act.bootstrap.tables.users.length >= 1);
    assert.ok(act.bootstrap.tables.products.length >= 1);
  });

  it('baseline + recent movements = every movement, per product', async () => {
    const pushed = await call(h.base, 'POST', API_PATHS.syncPush, {
      token: act.deviceToken,
      body: JSON.parse(
        encodeJson({
          deltas: [
            movement('01JSNAP00000000000000000A1', 200, 'entrada', 10),
            movement('01JSNAP00000000000000000A2', 120, 'salida', 4),
            movement('01JSNAP00000000000000000A3', 1, 'entrada', 7),
          ],
        }),
      ),
    });
    assert.equal(pushed.status, 200, JSON.stringify(pushed.body));
    assert.equal((pushed.body['rejected'] as unknown[]).length, 0, JSON.stringify(pushed.body));

    const legacy = await pull('since=0');
    assert.equal(legacy.snapshot, undefined, 'no snapshot without opting in');
    const pages = await snapshotPages();
    const rows = pages.flatMap((p) => p.tables.inventory_movements) as unknown as Movement[];
    const baseline = pages.flatMap((p) => p.snapshot?.stockBaseline ?? []);
    const all = legacy.tables.inventory_movements as unknown as Movement[];
    assert.deepEqual(stockOf(rows, baseline), stockOf(all));
    const ids = new Set(rows.map((m) => m.id));
    assert.ok(ids.has('01JSNAP00000000000000000A3'), 'a recent movement travels as a row');
    assert.ok(!ids.has('01JSNAP00000000000000000A1'), 'an old one only in the baseline');
  });

  it('pages chain at one cursor, only the first is first, and the device pulls on from it', async (ctx) => {
    if (h.isMock) {
      await fetch(`${h.base}/__mock/snapshot-budget`, { method: 'POST', body: '{"rows":7}' });
      ctx.onTestFinished(async () => {
        await fetch(`${h.base}/__mock/snapshot-budget`, { method: 'POST', body: '{}' });
      });
    }
    const pages = await snapshotPages();
    if (h.isMock) assert.ok(pages.length > 1, `${pages.length} page(s) at 7 rows a page`);
    const seq = pages[0]?.serverSeq;
    assert.ok(
      pages.every((p) => p.serverSeq === seq),
      'one cursor for the whole snapshot',
    );
    assert.deepEqual(
      pages.map((p) => p.snapshot?.first),
      pages.map((_, i) => i === 0),
    );
    const ids = pages.flatMap((p) => Object.values(p.tables).flat() as { id?: string }[]);
    const keyed = ids.filter((r) => typeof r.id === 'string').map((r) => r.id);
    assert.equal(new Set(keyed).size, keyed.length, 'no row twice');
    const after = await pull(`since=${seq}`);
    assert.equal(after.snapshot, undefined);
  });

  it('refuses a snapshot token it never issued with 400 VALIDATION', async () => {
    const r = await call(h.base, 'GET', `${API_PATHS.syncPull}?since=0&snapshot=forged-token`, {
      token: act.deviceToken,
    });
    assert.equal(r.status, 400, JSON.stringify(r.body));
    assert.equal((r.body['error'] as { code: string }).code, 'VALIDATION');
  });
});
