import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { MockApi, type MockResponse } from '../src/mock/handler.js';
import { MOCK_CODES } from '../src/mock/state.js';
import { API_PATHS, HEADER_PROTOCOL, PROTOCOL_VERSION } from '../src/transport.js';
import { SCENARIO_HEADER } from '../src/mock/scenarios.js';

/**
 * The mock's own control surface and refusals — the branches the
 * conformance suite (happy paths over HTTP) never takes. Everything drives
 * `MockApi.handle` directly: the transport is the wrapper's business.
 *
 *   /__mock/reset · code · qr · forget · restore · scenario
 *   protocol missing · unauthenticated · unknown bearer · revoked scenario
 *   404 · pull validation
 */

const DEVICE = { name: 'iPhone', platform: 'ios', appVersion: '1.0.0', osVersion: '18.1' };

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
    headers: {
      [HEADER_PROTOCOL.toLowerCase()]: String(PROTOCOL_VERSION),
      ...Object.fromEntries(
        Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
      ),
    },
    body: opts.body,
  });
}

const codigo = (body: unknown) => (body as { error?: { code?: string } }).error?.code;

describe('control routes', () => {
  it('reset puts the fixtures back, including a row a test forgot away', async () => {
    const api = new MockApi();
    const id = api.state.rowsOf('products', 0)[0]?.row.id as string;
    const olvidada = await llamada(api, 'POST', '/__mock/forget', {
      body: { table: 'products', id },
    });
    assert.equal((olvidada.body as { removed: boolean }).removed, true);

    const r = await llamada(api, 'POST', '/__mock/reset');
    assert.deepEqual(r.body, { ok: true });
    assert.equal(api.state.rowsOf('products', 0).length > 0, true);
  });

  it('issues an activation code from the alphabet, and a scan token with or without time', async () => {
    const api = new MockApi();
    const c = await llamada(api, 'POST', '/__mock/code');
    assert.match(String((c.body as { code: string }).code), /^[A-Z2-9]{8}$/);
    const qr = await llamada(api, 'POST', '/__mock/qr');
    const vencido = await llamada(api, 'POST', '/__mock/qr', { body: { expired: true } });
    assert.ok(String((qr.body as { token: string }).token).length > 0);
    assert.ok(String((vencido.body as { token: string }).token).length > 0);
  });

  it('forget refuses a body that is not { table, id }, and says so when nothing was there', async () => {
    const api = new MockApi();
    for (const malo of [null, {}, { table: 'products' }, { table: 1, id: 'x' }]) {
      const r = await llamada(api, 'POST', '/__mock/forget', { body: malo });
      assert.equal(r.status, 400);
      assert.equal(codigo(r.body), 'VALIDATION');
    }
    const nadie = await llamada(api, 'POST', '/__mock/forget', {
      body: { table: 'products', id: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' },
    });
    assert.deepEqual(nadie.body, { removed: false });
  });

  it('restore brings a forgotten row back, once, and only if it was forgotten', async () => {
    const api = new MockApi();
    const id = api.state.rowsOf('products', 0)[0]?.row.id as string;
    await llamada(api, 'POST', '/__mock/forget', { body: { table: 'products', id } });
    const vuelta = await llamada(api, 'POST', '/__mock/restore', {
      body: { table: 'products', id },
    });
    assert.deepEqual(vuelta.body, { restored: true });
    const otraVez = await llamada(api, 'POST', '/__mock/restore', {
      body: { table: 'products', id },
    });
    assert.deepEqual(otraVez.body, { restored: false });
    const malo = await llamada(api, 'POST', '/__mock/restore', { body: 'x' });
    assert.equal(malo.status, 400);
  });

  it('scenario sets the default and the record limit, and refuses nonsense', async () => {
    const api = new MockApi();
    const bien = await llamada(api, 'POST', '/__mock/scenario', {
      body: { scenario: 'xangarrito', transactionsPerMonth: 5 },
    });
    assert.deepEqual(bien.body, { scenario: 'xangarrito', transactionsPerMonth: 5 });

    const sinLimite = await llamada(api, 'POST', '/__mock/scenario', {
      body: { scenario: 'grace' },
    });
    assert.deepEqual(sinLimite.body, { scenario: 'grace', transactionsPerMonth: 'plan default' });

    for (const malo of [
      { scenario: 'no-existe' },
      { scenario: 'xangarro', transactionsPerMonth: 0 },
      { scenario: 'xangarro', transactionsPerMonth: 1.5 },
      { scenario: 'xangarro', transactionsPerMonth: '5' },
      null,
    ]) {
      const r = await llamada(api, 'POST', '/__mock/scenario', { body: malo });
      assert.equal(r.status, 400, JSON.stringify(malo));
    }
  });

  it('control answers only POST: a GET falls through to the protocol gate', async () => {
    const api = new MockApi();
    const r = await api.handle({
      method: 'GET',
      path: '/__mock/reset',
      query: {},
      headers: {},
      body: undefined,
    });
    assert.equal(codigo(r.body), 'PROTOCOL_UNSUPPORTED');
  });
});

describe('the protocol and auth gates', () => {
  it('a request without the protocol header is refused with how to fix it', async () => {
    const api = new MockApi();
    const r = await api.handle({
      method: 'POST',
      path: API_PATHS.activate,
      query: {},
      headers: {},
      body: { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.valid, device: DEVICE },
    });
    assert.equal(codigo(r.body), 'PROTOCOL_UNSUPPORTED');
    assert.match(JSON.stringify(r.body), /X-Xangarro-Protocol/);
  });

  it('no token is UNAUTHENTICATED; an unknown bearer is DEVICE_REVOKED', async () => {
    const api = new MockApi();
    const sin = await llamada(api, 'GET', API_PATHS.syncPull, { query: { since: '0' } });
    assert.equal(codigo(sin.body), 'UNAUTHENTICATED');

    const raro = await llamada(api, 'GET', API_PATHS.syncPull, {
      query: { since: '0' },
      headers: { Authorization: 'Bearer mock-device:01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' },
    });
    assert.equal(codigo(raro.body), 'DEVICE_REVOKED');
  });

  it('the revoked scenario fails even a device the state knows', async () => {
    const api = new MockApi();
    const alta = await llamada(api, 'POST', API_PATHS.activate, {
      body: { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.valid, device: DEVICE },
    });
    const token = (alta.body as { deviceToken: string }).deviceToken;
    const r = await llamada(api, 'GET', API_PATHS.entitlement, {
      headers: { Authorization: `Bearer ${token}`, [SCENARIO_HEADER]: 'revoked' },
    });
    assert.equal(codigo(r.body), 'DEVICE_REVOKED');
  });
});

describe('activate · refusals the conformance suite does not take', () => {
  it('an invalid body, a used code, an expired one, and no slots', async () => {
    const api = new MockApi();
    const malBody = await llamada(api, 'POST', API_PATHS.activate, { body: { email: 'x' } });
    assert.equal(malBody.status, 400);
    assert.equal(codigo(malBody.body), 'CODE_INVALID');

    const usada = await llamada(api, 'POST', API_PATHS.activate, {
      body: { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.used, device: DEVICE },
    });
    assert.equal(codigo(usada.body), 'CODE_USED');

    const vencida = await llamada(api, 'POST', API_PATHS.activate, {
      body: { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.expired, device: DEVICE },
    });
    assert.equal(codigo(vencida.body), 'CODE_EXPIRED');

    const sinCupo = await llamada(api, 'POST', API_PATHS.activate, {
      body: { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.noSlots, device: DEVICE },
    });
    assert.equal(codigo(sinCupo.body), 'NO_DEVICE_SLOTS');

    // A wrong email never reveals whether the code exists.
    const correoRaro = await llamada(api, 'POST', API_PATHS.activate, {
      body: { email: 'otro@xangarro.mx', code: MOCK_CODES.used, device: DEVICE },
    });
    assert.equal(codigo(correoRaro.body), 'CODE_INVALID');
  });
});

describe('device routes', () => {
  async function dispositivo(): Promise<{ api: MockApi; token: string }> {
    const api = new MockApi();
    const alta = await llamada(api, 'POST', API_PATHS.activate, {
      body: { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.valid, device: DEVICE },
    });
    return { api, token: (alta.body as { deviceToken: string }).deviceToken };
  }

  it('a device may pull and read its entitlement', async () => {
    const { api, token } = await dispositivo();
    const pull = await llamada(api, 'GET', API_PATHS.syncPull, {
      query: { since: '0' },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(pull.status, 200);
    assert.ok(typeof (pull.body as { serverSeq: number }).serverSeq === 'number');

    const ent = await llamada(api, 'GET', API_PATHS.entitlement, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(ent.status, 200);
    assert.ok(typeof (ent.body as { entitlement: unknown }).entitlement === 'object');

    // since must be a non-negative integer.
    const malSince = await llamada(api, 'GET', API_PATHS.syncPull, {
      query: { since: '-1' },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(malSince.status, 400);
    assert.equal(codigo(malSince.body), 'VALIDATION');
  });

  it('a path nobody serves is a 404 that names itself', async () => {
    const { api, token } = await dispositivo();
    const r = await llamada(api, 'GET', '/api/v1/nadie', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(r.status, 404);
    assert.match(JSON.stringify(r.body), /nadie/);
  });
});
