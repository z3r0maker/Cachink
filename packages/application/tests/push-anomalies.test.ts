import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { bigintKeys, PUSH_ROW_SCHEMAS, type Delta } from '@xangarro/contracts';

import { NEVER_NEGATIVE_MONEY, pushAnomalies } from '../src/apply-push/index.js';
import { delta } from './support/push-deltas.js';

/**
 * Security audit 2026-11, F-05 c: what a push carries that an honest device
 * would not — observed, never refused. The detector is a pure function of the
 * deltas and the device the token names; the portal logs what it returns.
 */
const DEVICE = '01HZ8XQN9GZJXV8AKQ5X0CDEV1';
const OTHER = '01HZ8XQN9GZJXV8AKQ5X0CDEV2';

const row = (table: Delta['table'], id: string, over: Record<string, unknown> = {}) =>
  delta(table, id, { deviceId: DEVICE, ...over });

describe('pushAnomalies', () => {
  it('finds nothing in an honest push', () => {
    const deltas = [
      row('client_payments', 'A1', { montoCentavos: 15_000n }),
      row('tickets', 'T1', { cambioCentavos: 0n, efectivoRecibidoCentavos: 20_000n }),
      row('tickets', 'T2', { cambioCentavos: null }),
      row('sales', 'S1', { monto: 4_500n }),
    ];
    assert.deepEqual(pushAnomalies(deltas, DEVICE), []);
  });

  it('flags a row captured under a device id that is not the token’s', () => {
    const found = pushAnomalies(
      [row('sales', 'S1'), row('sales', 'S2', { deviceId: OTHER })],
      DEVICE,
    );
    assert.deepEqual(found, [
      { table: 'sales', rowId: 'S2', kind: 'DEVICE_MISMATCH', field: 'deviceId' },
    ]);
  });

  it('flags a row with no device id as a mismatch too', () => {
    const found = pushAnomalies([row('sales', 'S1', { deviceId: undefined })], DEVICE);
    assert.equal(found[0]?.kind, 'DEVICE_MISMATCH');
  });

  it('flags negative money only where the code never produces one', () => {
    const found = pushAnomalies(
      [
        row('client_payments', 'A1', { montoCentavos: -1n }),
        row('tickets', 'T1', { cambioCentavos: -500n }),
      ],
      DEVICE,
    );
    assert.deepEqual(found, [
      { table: 'client_payments', rowId: 'A1', kind: 'NEGATIVE_MONEY', field: 'montoCentavos' },
      { table: 'tickets', rowId: 'T1', kind: 'NEGATIVE_MONEY', field: 'cambioCentavos' },
    ]);
  });

  it('leaves alone the amounts that are legitimately negative, or not proven otherwise', () => {
    const deltas = [
      // A shortfall at close, and an expected cash below zero, are real.
      row('caja_turnos', 'C1', { diferenciaCentavos: -6_000n, efectivoEsperadoCentavos: -1n }),
      row('day_closes', 'D1', { diferenciaCentavos: -2_000n }),
      // The domain's statements model a refund as a negative sale.
      row('sales', 'S1', { monto: -4_500n }),
      row('cancelacion_logs', 'L1', { montoOriginalCentavos: -4_500n }),
    ];
    assert.deepEqual(pushAnomalies(deltas, DEVICE), []);
  });

  it('reads money as the wire may carry it: bigint, decimal string or integer', () => {
    const negative = [-1n, '-1', -1].map((v, i) =>
      row('client_payments', `A${i}`, { montoCentavos: v }),
    );
    assert.equal(pushAnomalies(negative, DEVICE).length, 3);
    const fine = [0n, '0', '-0', 12, '12', null, undefined, 'abc', {}].map((v, i) =>
      row('client_payments', `B${i}`, { montoCentavos: v }),
    );
    assert.deepEqual(pushAnomalies(fine, DEVICE), []);
  });

  it('reports every anomaly of a row, and carries no value — only names', () => {
    const found = pushAnomalies(
      [row('client_payments', 'A1', { deviceId: OTHER, montoCentavos: -99_999n })],
      DEVICE,
    );
    assert.deepEqual(
      found.map((a) => a.kind),
      ['DEVICE_MISMATCH', 'NEGATIVE_MONEY'],
    );
    const text = JSON.stringify(found);
    assert.ok(!text.includes('99999') && !text.includes(OTHER));
  });

  it('only watches money fields the contract really has: a renamed one fails here, not silently', () => {
    for (const [table, fields] of Object.entries(NEVER_NEGATIVE_MONEY)) {
      const money = bigintKeys(PUSH_ROW_SCHEMAS[table as keyof typeof PUSH_ROW_SCHEMAS]);
      assert.ok(fields.length > 0, table);
      for (const field of fields) assert.ok(money.includes(field), `${table}.${field}`);
    }
    assert.deepEqual(Object.keys(NEVER_NEGATIVE_MONEY).sort(), ['client_payments', 'tickets']);
  });
});
