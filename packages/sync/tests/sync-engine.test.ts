import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { MOCK_CODES, startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import {
  DrizzleAppConfigRepository,
  DrizzleSalesRepository,
  DrizzleTicketsRepository,
  type XangarroDatabase,
} from '@xangarro/data';
import type { BusinessId, DeviceId, ProductId } from '@xangarro/domain';
import { makeFreshDb } from '../../data/tests/helpers/fresh-db.js';
import { ApiClient } from '../src/api-client.js';
import { coalesce } from '../src/outbox-reader.js';
import { drainPush } from '../src/push.js';
import { pullAll } from '../src/pull.js';
import { applyReferenceTables } from '../src/reference-applier.js';
import { StatusStore, backoffMs } from '../src/status-store.js';
import { SyncEngine } from '../src/sync-engine.js';
import { SYNC_CONFIG_KEYS } from '../src/sync-keys.js';

let mock: RunningMock;
beforeAll(async () => {
  mock = await startMockServer(0);
});
afterAll(async () => {
  await mock.close();
});

interface Device {
  db: XangarroDatabase;
  token: string;
  businessId: BusinessId;
  deviceId: DeviceId;
  productId: ProductId;
}

async function activatedDevice(): Promise<Device> {
  await fetch(`${mock.url}/__mock/reset`, { method: 'POST' });
  const client = new ApiClient({ baseUrl: mock.url });
  const act = await client.activate({
    email: 'dueno@tacoslaesquina.mx',
    code: MOCK_CODES.valid,
    device: { name: 'Test', platform: 'ios', appVersion: '0.1.0', osVersion: '18' },
  });
  if (!act.ok) throw new Error(act.code);
  const db = makeFreshDb();
  await applyReferenceTables(db, act.data.bootstrap.tables, act.data.businessId);
  return {
    db,
    token: act.data.deviceToken,
    businessId: act.data.businessId as BusinessId,
    deviceId: act.data.deviceId as DeviceId,
    productId: act.data.bootstrap.tables.products[0]!.id as ProductId,
  };
}

async function ringSale(d: Device, productId: ProductId = d.productId): Promise<string> {
  const tickets = new DrizzleTicketsRepository(d.db, d.deviceId);
  const ticket = await tickets.create({
    folio: await tickets.nextFolio(d.businessId),
    fecha: '2026-09-16',
    concepto: 'Tacos',
    metodo: 'Efectivo',
    estadoPago: 'pagado',
    businessId: d.businessId,
  });
  const sale = await new DrizzleSalesRepository(d.db, d.deviceId).create({
    ticketId: ticket.id,
    fecha: '2026-09-16',
    concepto: 'Tacos',
    categoria: 'Producto',
    monto: 4500n,
    productoId: productId,
    cantidad: 3,
    businessId: d.businessId,
  } as never);
  return sale.id;
}

function deps(d: Device, opts: { now?: Date; headers?: Record<string, string> } = {}) {
  const client = new ApiClient({ baseUrl: mock.url, extraHeaders: opts.headers });
  const appConfig = new DrizzleAppConfigRepository(d.db);
  return { db: d.db, appConfig, client, token: d.token, now: () => opts.now ?? new Date() };
}

describe('coalesce', () => {
  it('folds edits per row, keeps insert over later updates, and drops non-pushable changes', () => {
    const out = coalesce([
      { id: 1, tableName: 'sales', rowId: 'S1', op: 'insert' },
      { id: 2, tableName: 'sales', rowId: 'S1', op: 'update' },
      { id: 3, tableName: 'products', rowId: 'P1', op: 'update' },
      { id: 4, tableName: 'employees', rowId: 'E1', op: 'insert' },
      { id: 5, tableName: 'products', rowId: 'P2', op: 'insert' },
    ]);
    assert.deepEqual(out, [
      { tableName: 'sales', rowId: 'S1', op: 'insert' },
      { tableName: 'products', rowId: 'P2', op: 'insert' },
    ]);
  });
});

describe('drainPush', () => {
  let d: Device;
  beforeEach(async () => {
    d = await activatedDevice();
  });

  it('pushes a rung sale (ticket + line) once, marks both accepted, and advances the cursor', async () => {
    const saleId = await ringSale(d);
    const first = await drainPush(deps(d));
    // ADR-073: the ticket header and its line are two rows in one batch.
    assert.deepEqual([first.accepted, first.rejected, first.error], [2, 0, null]);
    const second = await drainPush(deps(d));
    assert.equal(second.batches, 0);
    const counts = await new StatusStore(d.db).countByStatus();
    assert.deepEqual(counts, { pending: 0, rejected: 0, retrying: 0 });
    assert.ok(saleId);
  });

  it('keeps a server-rejected row with its code instead of skipping it', async () => {
    const unknownProduct = '01JPRD0000000000000000ZZZZ' as ProductId;
    await ringSale(d, unknownProduct);
    const out = await drainPush(deps(d));
    assert.equal(out.rejected, 1); // the line; the ticket accepts
    const counts = await new StatusStore(d.db).countByStatus();
    assert.equal(counts.rejected, 1);
  });

  it('leaves the cursor untouched when the batch fails as a whole (offline)', async () => {
    await ringSale(d);
    const offline = { ...deps(d), client: new ApiClient({ baseUrl: 'http://127.0.0.1:1' }) };
    const out = await drainPush(offline);
    assert.equal(out.error?.code, 'NETWORK');
    assert.equal(await deps(d).appConfig.get(SYNC_CONFIG_KEYS.pushHwm), null);
    const retry = await drainPush(deps(d));
    assert.equal(retry.accepted, 2); // ticket + line
  });

  it('retries transient rejections only after their backoff elapses', async () => {
    for (let i = 0; i < 12; i += 1) await ringSale(d);
    const t0 = new Date('2026-09-16T12:00:00.000Z');
    const flaky = await drainPush(deps(d, { now: t0, headers: { 'X-Mock-Scenario': 'flaky' } }));
    assert.ok(flaky.rejected > 0, 'the flaky scenario should reject some rows');
    const tooSoon = await drainPush(deps(d, { now: new Date(t0.getTime() + 1_000) }));
    assert.equal(tooSoon.batches, 0);
    const later = await drainPush(deps(d, { now: new Date(t0.getTime() + backoffMs(1) + 1) }));
    assert.equal(later.accepted, flaky.rejected);
    assert.equal((await new StatusStore(d.db).countByStatus()).retrying, 0);
  });
});

describe('pullAll', () => {
  it('stores entitlement, server clocks and acknowledgedThrough after a push', async () => {
    const d = await activatedDevice();
    await ringSale(d);
    await drainPush(deps(d));
    const out = await pullAll(deps(d));
    assert.equal(out.error, null);
    const c = deps(d).appConfig;
    assert.ok(Number(await c.get(SYNC_CONFIG_KEYS.acknowledgedThrough)) > 0);
    assert.ok(await c.get(SYNC_CONFIG_KEYS.lastPullAt));
    assert.ok(JSON.parse((await c.get(SYNC_CONFIG_KEYS.entitlement)) ?? '{}').signature);
  });
});

describe('SyncEngine', () => {
  it('shares one in-flight run between concurrent callers and reports revocation', async () => {
    const d = await activatedDevice();
    await ringSale(d);
    const engine = new SyncEngine({
      db: d.db,
      client: new ApiClient({ baseUrl: mock.url }),
      getToken: async () => d.token,
    });
    const [a, b] = await Promise.all([engine.syncNow(), engine.syncNow()]);
    assert.equal(a, b);
    assert.equal(a.push?.accepted, 2); // ticket + line
    const revoked = new SyncEngine({
      db: d.db,
      client: new ApiClient({ baseUrl: mock.url, extraHeaders: { 'X-Mock-Scenario': 'revoked' } }),
      getToken: async () => d.token,
    });
    await ringSale(d);
    assert.equal((await revoked.syncNow()).revoked, true);
  });

  it('lists rejected rows with their local data and requeues them for retry (A-08)', async () => {
    const d = await activatedDevice();
    // The product the device knows was purged on the server (mock control route).
    const forgot = await fetch(`${mock.url}/__mock/forget`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ table: 'products', id: d.productId }),
    });
    assert.deepEqual(await forgot.json(), { removed: true });
    const saleId = await ringSale(d);
    const engine = new SyncEngine({
      db: d.db,
      client: new ApiClient({ baseUrl: mock.url }),
      getToken: async () => d.token,
    });
    await engine.syncNow();
    const [row] = await engine.rejected();
    assert.equal(row?.tableName, 'sales');
    assert.equal(row?.rowId, saleId);
    assert.equal(row?.code, 'FK_PRODUCT_MISSING');
    assert.equal(row?.retryable, false);
    assert.equal(row?.row?.['concepto'], 'Tacos');
    await engine.requeue('sales', saleId);
    assert.deepEqual(await engine.counts(), { pending: 0, rejected: 0, retrying: 1 });
    assert.equal((await engine.rejected())[0]?.retryable, true);
    // Still missing on the server: the retry is refused again and waits for a human.
    await engine.syncNow();
    assert.deepEqual(await engine.counts(), { pending: 0, rejected: 1, retrying: 0 });
    // The portal restores the product: the next manual retry is accepted.
    await fetch(`${mock.url}/__mock/restore`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ table: 'products', id: d.productId }),
    });
    await engine.requeue('sales', saleId);
    await engine.syncNow();
    assert.deepEqual(await engine.rejected(), []);
  });

  it('runs the retention purge after a clean pull, at most once per server day (A-11)', async () => {
    const d = await activatedDevice();
    const engine = new SyncEngine({
      db: d.db,
      client: new ApiClient({ baseUrl: mock.url }),
      getToken: async () => d.token,
    });
    const first = await engine.syncNow();
    assert.deepEqual(first.purge, { skipped: null, cutoff: first.purge?.cutoff, deleted: {} });
    assert.equal((await engine.syncNow()).purge, null);
  });

  it('does nothing before activation', async () => {
    const engine = new SyncEngine({
      db: makeFreshDb(),
      client: new ApiClient({ baseUrl: mock.url }),
      getToken: async () => null,
    });
    assert.deepEqual(await engine.syncNow(), { push: null, pull: null, revoked: false });
  });
});
