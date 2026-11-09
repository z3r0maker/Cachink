import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { PullResponseSchema } from '../src/sync-pull.js';
import { PushResponseSchema } from '../src/sync-push.js';
import { FIXTURE_BUSINESS_ID, MockApi, type MockResponse } from '../src/mock/handler.js';
import { SCENARIO_HEADER } from '../src/mock/scenarios.js';
import { MOCK_CODES } from '../src/mock/state.js';
import { API_PATHS, HEADER_PROTOCOL, PROTOCOL_VERSION } from '../src/transport.js';
import { encodeJson } from '../src/wire.js';

/**
 * ADR-065 / N-04 on the wire (catalogue J6-15, gap 6): a paid business past
 * its monthly transactions is never refused a row. Under `over-limit` the
 * entitlement allows five a month; eight tickets go up, every one accepted,
 * and the pull's unsigned `usage` block says eight — 160 % — beside the
 * limit it exceeds. The same eight re-pushed land on the same serverSeq, so
 * a retry never inflates the count, and a reset puts usage back to zero.
 */

const DEVICE = { name: 'iPhone', platform: 'ios', appVersion: '1.0.0', osVersion: '18.1' };
const OVER = { [SCENARIO_HEADER]: 'over-limit' };

function llamada(
  api: MockApi,
  method: string,
  path: string,
  opts: { query?: Record<string, string>; headers?: Record<string, string>; body?: unknown } = {},
): Promise<MockResponse> {
  return api.handle({
    method,
    path,
    query: opts.query ?? {},
    headers: { [HEADER_PROTOCOL.toLowerCase()]: String(PROTOCOL_VERSION), ...opts.headers },
    body: opts.body,
  });
}

async function dispositivo(): Promise<{
  api: MockApi;
  auth: Record<string, string>;
  deviceId: string;
}> {
  const api = new MockApi();
  const alta = await llamada(api, 'POST', API_PATHS.activate, {
    headers: OVER,
    body: { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.valid, device: DEVICE },
  });
  const body = alta.body as { deviceToken: string; deviceId: string };
  return {
    api,
    auth: { authorization: `Bearer ${body.deviceToken}`, ...OVER },
    deviceId: body.deviceId,
  };
}

const HOY = new Date();
const ts = HOY.toISOString();
const fecha = ts.slice(0, 10);

function ticket(n: number, deviceId: string): Record<string, unknown> {
  return {
    id: `01JTK000000000000000000${String(n).padStart(3, '0')}`,
    folio: 400 + n,
    fecha,
    hora: '13:45',
    concepto: 'Venta mostrador',
    metodo: 'Efectivo',
    clienteId: null,
    estadoPago: 'pagado',
    efectivoRecibidoCentavos: 5_000n,
    cambioCentavos: 2_500n,
    cajaTurnoId: null,
    cancelMotivo: null,
    cancelledByUserId: null,
    cancelledAt: null,
    businessId: FIXTURE_BUSINESS_ID,
    deviceId,
    createdByUserId: null,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
}

const deltas = (rows: Record<string, unknown>[]) =>
  JSON.parse(
    encodeJson({
      deltas: rows.map((row, i) => ({
        table: 'tickets',
        rowId: row['id'],
        op: 'insert',
        clientSeq: i + 1,
        row,
      })),
    }),
  ) as unknown;

describe('over-limit · the limit is advice, the rows all land', () => {
  it('eight tickets against a limit of five: every row accepted, usage says eight', async () => {
    const { api, auth, deviceId } = await dispositivo();
    const ocho = Array.from({ length: 8 }, (_, i) => ticket(i + 1, deviceId));
    const push = await llamada(api, 'POST', API_PATHS.syncPush, {
      headers: auth,
      body: deltas(ocho),
    });
    assert.equal(push.status, 200, JSON.stringify(push.body));
    const subida = PushResponseSchema.parse(push.body);
    assert.equal(subida.rejected.length, 0);
    assert.deepEqual(
      subida.accepted.map((a) => a.rowId),
      ocho.map((t) => t['id']),
    );

    const pull = await llamada(api, 'GET', API_PATHS.syncPull, {
      headers: auth,
      query: { since: '0' },
    });
    assert.equal(pull.status, 200);
    const bajada = PullResponseSchema.parse(pull.body);
    assert.equal(bajada.entitlement.payload.limits.transactionsPerMonth, 5);
    assert.ok(bajada.usage, 'the pull carries the usage block');
    assert.equal(bajada.usage.period, fecha.slice(0, 7));
    assert.equal(bajada.usage.transactions, 8);
    assert.ok(bajada.usage.transactions > bajada.entitlement.payload.limits.transactionsPerMonth);
    assert.ok(bajada.usage.products > 0);
  });

  it('a re-push of the same rows is idempotent: same serverSeq, usage unchanged', async () => {
    const { api, auth, deviceId } = await dispositivo();
    const ocho = Array.from({ length: 8 }, (_, i) => ticket(i + 1, deviceId));
    const primera = PushResponseSchema.parse(
      (await llamada(api, 'POST', API_PATHS.syncPush, { headers: auth, body: deltas(ocho) })).body,
    );
    const segunda = PushResponseSchema.parse(
      (await llamada(api, 'POST', API_PATHS.syncPush, { headers: auth, body: deltas(ocho) })).body,
    );
    assert.deepEqual(
      segunda.accepted.map((a) => a.serverSeq),
      primera.accepted.map((a) => a.serverSeq),
    );
    const pull = await llamada(api, 'GET', API_PATHS.syncPull, {
      headers: auth,
      query: { since: '0' },
    });
    assert.equal(PullResponseSchema.parse(pull.body).usage?.transactions, 8);
  });

  it('a ticket dated another month, or soft-deleted, is not this month’s usage', async () => {
    const { api, auth, deviceId } = await dispositivo();
    const otroMes = { ...ticket(1, deviceId), fecha: '2001-01-15' };
    const borrado = { ...ticket(2, deviceId), deletedAt: ts };
    const push = await llamada(api, 'POST', API_PATHS.syncPush, {
      headers: auth,
      body: deltas([otroMes, borrado, ticket(3, deviceId)]),
    });
    assert.equal(PushResponseSchema.parse(push.body).rejected.length, 0);
    const pull = await llamada(api, 'GET', API_PATHS.syncPull, {
      headers: auth,
      query: { since: '0' },
    });
    assert.equal(PullResponseSchema.parse(pull.body).usage?.transactions, 1);
  });

  it('reset puts usage back to zero', async () => {
    const { api, auth, deviceId } = await dispositivo();
    await llamada(api, 'POST', API_PATHS.syncPush, {
      headers: auth,
      body: deltas([ticket(1, deviceId)]),
    });
    await llamada(api, 'POST', '/__mock/reset');
    // The device went with the reset; a fresh activation reads the empty month.
    const alta = await llamada(api, 'POST', API_PATHS.activate, {
      headers: OVER,
      body: { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.valid, device: DEVICE },
    });
    const token = (alta.body as { deviceToken: string }).deviceToken;
    const pull = await llamada(api, 'GET', API_PATHS.syncPull, {
      headers: { ...OVER, authorization: `Bearer ${token}` },
      query: { since: '0' },
    });
    assert.equal(PullResponseSchema.parse(pull.body).usage?.transactions, 0);
  });
});
