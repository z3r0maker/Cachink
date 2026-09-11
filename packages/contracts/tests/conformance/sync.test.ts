import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ActivateResponseSchema, type ActivateResponse } from '../../src/activate.js';
import { PullResponseSchema } from '../../src/sync-pull.js';
import { PushResponseSchema } from '../../src/sync-push.js';
import { API_PATHS } from '../../src/transport.js';
import { encodeJson } from '../../src/wire.js';
import { DEVICE, call, startHarness, verifyEntitlement, type Harness } from './setup.js';

let h: Harness;
let act: ActivateResponse;
beforeAll(async () => {
  h = await startHarness();
  const r = await call(h.base, 'POST', API_PATHS.activate, {
    body: { email: h.email, code: await h.freshCode(), device: DEVICE },
  });
  act = ActivateResponseSchema.parse(r.body);
});
afterAll(async () => {
  await h.close();
});

const ts = '2026-09-11T18:30:00.000Z';
function sale(id: string, over: Record<string, unknown> = {}) {
  const product = act.bootstrap.tables.products[0];
  if (!product) throw new Error('fixture has no products');
  return {
    id,
    fecha: '2026-09-11',
    hora: '12:30',
    concepto: 'Conformance sale',
    categoria: 'Producto',
    monto: 4500n,
    metodo: 'Efectivo',
    clienteId: null,
    estadoPago: 'pagado',
    productoId: product.id,
    cantidad: 3,
    efectivoRecibidoCentavos: 5000n,
    cancelledByUserId: null,
    cancelMotivo: null,
    cancelledAt: null,
    cajaTurnoId: null,
    businessId: act.businessId,
    deviceId: act.deviceId,
    createdByUserId: null,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
    ...over,
  };
}
const delta = (
  row: Record<string, unknown>,
  clientSeq: number,
  op: 'insert' | 'update' = 'insert',
  table = 'sales',
) => ({ table, rowId: String(row['id']), op, clientSeq, row });
const push = (deltas: unknown[]) =>
  call(h.base, 'POST', API_PATHS.syncPush, {
    token: act.deviceToken,
    body: JSON.parse(encodeJson({ deltas })),
  });
const pull = (since: number) =>
  call(h.base, 'GET', `${API_PATHS.syncPull}?since=${since}`, { token: act.deviceToken });

/** A real product from the bootstrap with a changed price — hybrid tables must reject updates. */
function productUpdate(): Record<string, unknown> {
  const product = act.bootstrap.tables.products[0];
  if (!product) throw new Error('fixture has no products');
  return { ...product, precioVentaCentavos: 99_999n, updatedAt: ts };
}

describe('POST /sync/push', () => {
  it('accepts valid rows, rejects per row, and never fails the batch for one bad row', async () => {
    const good = sale('01JSA0000000000000000000A1');
    const fkMissing = sale('01JSA0000000000000000000A2', {
      productoId: '01JPRD000000000000000MSSNG',
    });
    const mismatch = sale('01JSA0000000000000000000A3', {
      businessId: '01JBZN0000000000000000THER',
    });
    const r = await push([
      delta(good, 1),
      delta(fkMissing, 2),
      delta(mismatch, 3),
      delta(productUpdate(), 4, 'update', 'products'),
    ]);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const body = PushResponseSchema.parse(r.body);
    assert.deepEqual(
      body.accepted.map((a) => a.rowId),
      [good.id],
    );
    const codes = Object.fromEntries(body.rejected.map((x) => [x.rowId, x.code]));
    assert.equal(codes[fkMissing.id], 'FK_PRODUCT_MISSING');
    assert.equal(codes[mismatch.id], 'BUSINESS_MISMATCH');
    assert.equal(codes[String(productUpdate()['id'])], 'HYBRID_UPDATE_FORBIDDEN');
    for (const x of body.rejected) assert.equal(x.retryable, false);
  });

  it('is idempotent: re-pushing an accepted row returns the same serverSeq', async () => {
    const row = sale('01JSA0000000000000000000B1');
    const first = PushResponseSchema.parse((await push([delta(row, 10)])).body);
    const second = PushResponseSchema.parse((await push([delta(row, 11)])).body);
    assert.equal(second.accepted[0]?.serverSeq, first.accepted[0]?.serverSeq);
  });

  it('rejects a batch that fails schema validation as a whole with 400', async () => {
    const r = await call(h.base, 'POST', API_PATHS.syncPush, {
      token: act.deviceToken,
      body: { deltas: [{ table: 'users', rowId: 'x', op: 'insert', clientSeq: 1, row: {} }] },
    });
    assert.equal(r.status, 400);
  });

  it('refuses an unauthenticated push', async () => {
    const r = await call(h.base, 'POST', API_PATHS.syncPush, { body: { deltas: [] } });
    assert.equal(r.status, 401);
  });
});

describe('GET /sync/pull', () => {
  it('since=0 returns the full reference set with a verifiable entitlement', async () => {
    const r = await pull(0);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const body = PullResponseSchema.parse(r.body);
    assert.ok(body.tables.products.length >= 1);
    assert.equal(await verifyEntitlement(body.entitlement), true);
  });

  it('since=<serverSeq> returns only newer rows and acknowledgedThrough is monotonic', async () => {
    const before = PullResponseSchema.parse((await pull(0)).body);
    const row = sale('01JSA0000000000000000000C1');
    const pushed = PushResponseSchema.parse((await push([delta(row, 20)])).body);
    const after = PullResponseSchema.parse((await pull(before.serverSeq)).body);
    assert.ok(after.acknowledgedThrough >= (pushed.accepted[0]?.serverSeq ?? Infinity));
    assert.ok(after.acknowledgedThrough >= before.acknowledgedThrough);
    assert.equal(after.tables.products.length, 0, 'reference rows unchanged since the last pull');
  });

  it('rejects a malformed since', async () => {
    const r = await call(h.base, 'GET', `${API_PATHS.syncPull}?since=-3`, {
      token: act.deviceToken,
    });
    assert.equal(r.status, 400);
  });
});

describe('GET /entitlement', () => {
  it('returns a signed entitlement for the device', async () => {
    const r = await call(h.base, 'GET', API_PATHS.entitlement, { token: act.deviceToken });
    assert.equal(r.status, 200);
    assert.equal(
      await verifyEntitlement(
        (r.body as { entitlement: ActivateResponse['entitlement'] }).entitlement,
      ),
      true,
    );
  });
});

describe('mock scenarios (mock only)', () => {
  it('revoked → 401 DEVICE_REVOKED; flaky → some INTERNAL/retryable rows; lapsed → entitlement past grace', async (ctx) => {
    if (!h.isMock) return ctx.skip();
    const revoked = await call(h.base, 'GET', API_PATHS.entitlement, {
      token: act.deviceToken,
      scenario: 'revoked',
    });
    assert.equal(revoked.status, 401);
    assert.equal((revoked.body['error'] as { code: string }).code, 'DEVICE_REVOKED');
    const many = Array.from({ length: 40 }, (_, i) =>
      delta(sale(`01JSA000000000000000000F${String(i).padStart(2, '0')}`), 100 + i),
    );
    const flaky = PushResponseSchema.parse(
      (
        await call(h.base, 'POST', API_PATHS.syncPush, {
          token: act.deviceToken,
          scenario: 'flaky',
          body: JSON.parse(encodeJson({ deltas: many })),
        })
      ).body,
    );
    assert.ok(
      flaky.rejected.length > 0 &&
        flaky.rejected.every((x) => x.code === 'INTERNAL' && x.retryable),
    );
    const lapsed = await call(h.base, 'GET', API_PATHS.entitlement, {
      token: act.deviceToken,
      scenario: 'lapsed',
    });
    const ent = (lapsed.body as { entitlement: { payload: { graceUntil: string } } }).entitlement;
    assert.ok(Date.parse(ent.payload.graceUntil) < Date.now());
  });
});
