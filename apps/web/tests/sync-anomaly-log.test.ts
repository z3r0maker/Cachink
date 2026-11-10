import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';
import type { PushAnomaly } from '@xangarro/application';

import {
  logPushAnomalies,
  MAX_LOGGED_ANOMALIES,
  pushAnomalyLine,
} from '../src/server/sync/anomaly-log';

/**
 * The line a push's anomalies are logged as (security audit 2026-11, F-05 c):
 * ids and names, counts by kind, bounded, and silent for an honest push.
 */
const SCOPE = { businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ', deviceId: '01HZ8XQN9GZJXV8AKQ5X0CDEV1' };
const mismatch = (rowId: string): PushAnomaly => ({
  table: 'sales',
  rowId,
  kind: 'DEVICE_MISMATCH',
  field: 'deviceId',
});
const negative: PushAnomaly = {
  table: 'client_payments',
  rowId: 'A1',
  kind: 'NEGATIVE_MONEY',
  field: 'montoCentavos',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pushAnomalyLine', () => {
  it('names the push, counts by kind and lists the rows by id and field', () => {
    assert.deepEqual(pushAnomalyLine(SCOPE, [mismatch('S1'), negative, mismatch('S2')]), {
      evt: 'push_anomaly',
      endpoint: 'sync/push',
      business_id: SCOPE.businessId,
      device_id: SCOPE.deviceId,
      total: 3,
      kinds: { DEVICE_MISMATCH: 2, NEGATIVE_MONEY: 1 },
      rows: [
        { table: 'sales', row_id: 'S1', kind: 'DEVICE_MISMATCH', field: 'deviceId' },
        { table: 'client_payments', row_id: 'A1', kind: 'NEGATIVE_MONEY', field: 'montoCentavos' },
        { table: 'sales', row_id: 'S2', kind: 'DEVICE_MISMATCH', field: 'deviceId' },
      ],
    });
  });

  it('lists a bounded number of rows and still counts them all', () => {
    const many = Array.from({ length: MAX_LOGGED_ANOMALIES + 25 }, (_, i) => mismatch(`S${i}`));
    const line = pushAnomalyLine(SCOPE, many);
    assert.equal(line['total'], MAX_LOGGED_ANOMALIES + 25);
    assert.equal((line['rows'] as unknown[]).length, MAX_LOGGED_ANOMALIES);
  });
});

describe('logPushAnomalies', () => {
  it('writes one JSON line for a push with anomalies', () => {
    const out = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    logPushAnomalies(SCOPE, [negative]);
    assert.equal(out.mock.calls.length, 1);
    const line = JSON.parse(String(out.mock.calls[0]?.[0])) as Record<string, unknown>;
    assert.equal(line['evt'], 'push_anomaly');
    assert.equal(line['total'], 1);
  });

  it('writes nothing for an honest push', () => {
    const out = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    logPushAnomalies(SCOPE, []);
    assert.equal(out.mock.calls.length, 0);
  });
});
