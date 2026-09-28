import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { PLAN_LIMITS } from '@xangarro/domain';

import { entitlementFor, isFlakyReject, isScenario, scenarioOf } from '../src/mock/scenarios.js';
import { encodeJson } from '../src/wire.js';
import { FIXTURE_BUSINESS_ID, MockApi, type MockResponse } from '../src/mock/handler.js';
import { MOCK_CODES } from '../src/mock/state.js';
import { API_PATHS, PROTOCOL_VERSION } from '../src/transport.js';

/**
 * The scenario table and the wire's bigint rule — the branches a single
 * happy entitlement never takes: each scenario's plan, period and limit;
 * the flaky reject's deterministic hash; and money that must arrive as a
 * decimal string. Plus one push under `flaky`, where a chosen row comes
 * back retryable while its neighbour is accepted.
 */

const DEVICE = { name: 'iPhone', platform: 'ios', appVersion: '1.0.0', osVersion: '18.1' };
const NOW = new Date('2026-09-27T12:00:00.000Z');

describe('entitlementFor · every scenario answers for itself', () => {
  it('the paid plan, thirty days, and the plan’s own record limit', () => {
    const e = entitlementFor('xangarro', 'b-1', NOW);
    assert.equal(e.plan, 'xangarro');
    assert.equal(e.limits.transactionsPerMonth, PLAN_LIMITS.xangarro!.transactionsPerMonth);
    assert.equal(new Date(e.validUntil).getTime(), NOW.getTime() + 30 * 86_400_000);
  });

  it('the free plan is good for a hundred years', () => {
    const e = entitlementFor('xangarrito', 'b-1', NOW);
    assert.equal(e.plan, 'xangarrito');
    assert.equal(new Date(e.validUntil).getTime(), NOW.getTime() + 36_500 * 86_400_000);
  });

  it('grace sits twelve days in the past; lapsed forty', () => {
    const g = entitlementFor('grace', 'b-1', NOW);
    const l = entitlementFor('lapsed', 'b-1', NOW);
    assert.equal(new Date(g.validUntil).getTime(), NOW.getTime() + 18 * 86_400_000);
    assert.equal(new Date(l.validUntil).getTime(), NOW.getTime() - 10 * 86_400_000);
  });

  it('over-limit reads as five records whatever the plan says; an override wins otherwise', () => {
    assert.equal(entitlementFor('over-limit', 'b-1', NOW).limits.transactionsPerMonth, 5);
    assert.equal(entitlementFor('xangarro', 'b-1', NOW, 7).limits.transactionsPerMonth, 7);
  });
});

describe('scenario plumbing', () => {
  it('the header wins; a nonsense header falls back to the default', () => {
    assert.equal(scenarioOf({ 'x-mock-scenario': 'lapsed' }, 'grace'), 'lapsed');
    assert.equal(scenarioOf({ 'x-mock-scenario': 'otra' }, 'grace'), 'grace');
    assert.equal(scenarioOf({}, 'revoked'), 'revoked');
    assert.equal(isScenario('flaky'), true);
    assert.equal(isScenario(7), false);
  });

  it('the flaky reject is deterministic: the same row always, its neighbour never', () => {
    let inestable = '';
    let estable = '';
    for (let i = 0; i < 50 && !(inestable && estable); i += 1) {
      const id = `01HZ8XQN9GZJXV8AKQ5X0C7F${String(i).padStart(2, '0')}`;
      if (isFlakyReject(id) && !inestable) inestable = id;
      if (!isFlakyReject(id) && !estable) estable = id;
    }
    assert.equal(isFlakyReject(inestable), true);
    assert.equal(isFlakyReject(estable), false);
  });
});

describe('wire', () => {
  it('bigint money arrives as a decimal string, exactly as the phone sends it', () => {
    assert.equal(encodeJson({ monto: 450_00n, nombre: 'x' }), '{"monto":"45000","nombre":"x"}');
  });
});

describe('a push the tables refuse', () => {
  it('a hybrid table is not updatable from the phone, and a reference table not even insertable', async () => {
    const api = new MockApi();
    const alta = await api.handle({
      method: 'POST',
      path: API_PATHS.activate,
      query: {},
      headers: { 'x-xangarro-protocol': String(PROTOCOL_VERSION) },
      body: { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.valid, device: DEVICE },
    });
    const cuerpo = alta.body as { deviceToken: string; deviceId: string };
    const cabecera = {
      'x-xangarro-protocol': String(PROTOCOL_VERSION),
      authorization: `Bearer ${cuerpo.deviceToken}`,
    };
    const producto = api.state.rowsOf('products', 0)[0]?.row as Record<string, unknown>;
    const r = await api.handle({
      method: 'POST',
      path: API_PATHS.syncPush,
      query: {},
      headers: cabecera,
      body: {
        deltas: [
          {
            table: 'products',
            rowId: producto.id as string,
            op: 'update',
            clientSeq: 1,
            row: producto,
          },
        ],
      },
    });
    const salida = r.body as { rejected: readonly { code: string }[] };
    assert.deepEqual(
      salida.rejected.map((x) => x.code),
      ['HYBRID_UPDATE_FORBIDDEN'],
    );
    // The state also takes a row without a sequence, as a control route would.
    const guardada = api.state.upsert('products', { ...producto, nombre: 'Cambiado por control' });
    assert.equal(guardada.row.nombre, 'Cambiado por control');
  });
});

describe('a push under flaky', () => {
  it('the chosen row is retryable and its neighbour is accepted', async () => {
    // Pick the pair from the hash itself, so the test says what it means.
    let inestable = '';
    let estable = '';
    for (let i = 0; i < 50 && !(inestable && estable); i += 1) {
      const id = `01HZ8XQN9GZJXV8AKQ5X0C7F${String(i).padStart(2, '0')}`;
      if (isFlakyReject(id) && !inestable) inestable = id;
      if (!isFlakyReject(id) && !estable) estable = id;
    }
    const api = new MockApi();
    const alta = await api.handle({
      method: 'POST',
      path: API_PATHS.activate,
      query: {},
      headers: { 'x-xangarro-protocol': String(PROTOCOL_VERSION) },
      body: { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.valid, device: DEVICE },
    });
    const token = (alta.body as { deviceToken: string }).deviceToken;
    const deviceId = (alta.body as { deviceId: string }).deviceId;
    // The sales row shape tests/endpoints.test.ts already proved parseable.
    const fila = (id: string) => ({
      id,
      ticketId: '01HZ8XQN9GZJXV8AKQ5X0C7TK1',
      fecha: '2026-09-27',
      concepto: 'Tacos',
      categoria: 'Producto',
      monto: '100',
      productoId: api.state.rowsOf('products', 0)[0]?.row.id as string,
      cantidad: 1,
      businessId: FIXTURE_BUSINESS_ID,
      deviceId,
      createdByUserId: null,
      createdAt: '2026-09-27T12:00:00.000Z',
      updatedAt: '2026-09-27T12:00:00.000Z',
      deletedAt: null,
    });
    const r: MockResponse = await api.handle({
      method: 'POST',
      path: API_PATHS.syncPush,
      query: {},
      headers: {
        'x-xangarro-protocol': String(PROTOCOL_VERSION),
        authorization: `Bearer ${token}`,
        'x-mock-scenario': 'flaky',
      },
      body: {
        deltas: [
          { table: 'sales', rowId: inestable, op: 'insert', clientSeq: 1, row: fila(inestable) },
          { table: 'sales', rowId: estable, op: 'insert', clientSeq: 2, row: fila(estable) },
        ],
      },
    });
    const cuerpo = r.body as {
      accepted: readonly { rowId: string }[];
      rejected: readonly { rowId: string; code: string }[];
    };
    assert.deepEqual(
      cuerpo.rejected.map((x) => [x.rowId, x.code]),
      [[inestable, 'INTERNAL']],
    );
    assert.deepEqual(
      cuerpo.accepted.map((x) => x.rowId),
      [estable],
    );
  });
});
