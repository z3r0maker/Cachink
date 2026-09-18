import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  CAPACITY_TRIGGERS,
  capacityMetrics,
  capacityStatus,
  CapacityInputError,
  worstStatus,
} from '@/server/capacity/status';

const GB = 1024 ** 3;

describe('capacityStatus', () => {
  it('is ok below 80 %, amber from 80 %, red at the trigger and beyond', () => {
    assert.equal(capacityStatus(0, 100), 'ok');
    assert.equal(capacityStatus(79, 100), 'ok');
    assert.equal(capacityStatus(80, 100), 'amber');
    assert.equal(capacityStatus(99, 100), 'amber');
    assert.equal(capacityStatus(100, 100), 'red');
    assert.equal(capacityStatus(5_000, 100), 'red');
  });

  it('uses exact integer arithmetic at the byte scale of the 25 GB trigger', () => {
    const trigger = 25 * GB;
    assert.equal(capacityStatus(20 * GB - 1, trigger), 'ok');
    assert.equal(capacityStatus(20 * GB, trigger), 'amber');
    assert.equal(capacityStatus(trigger - 1, trigger), 'amber');
    assert.equal(capacityStatus(trigger, trigger), 'red');
  });

  it('reports a missing measurement as sin-datos, never as ok', () => {
    assert.equal(capacityStatus(null, 800), 'sin-datos');
  });

  it('rejects a negative or non-finite measurement', () => {
    assert.throws(() => capacityStatus(-1, 100), CapacityInputError);
    assert.throws(() => capacityStatus(Number.NaN, 100), CapacityInputError);
    assert.throws(() => capacityStatus(Number.POSITIVE_INFINITY, 100), CapacityInputError);
  });

  it('rejects a trigger that is not a positive number', () => {
    assert.throws(() => capacityStatus(1, 0), CapacityInputError);
    assert.throws(() => capacityStatus(1, -5), CapacityInputError);
    assert.throws(() => capacityStatus(1, Number.NaN), CapacityInputError);
  });

  it('carries a code on its error', () => {
    try {
      capacityStatus(-1, 100);
      assert.fail('expected a throw');
    } catch (e) {
      assert.ok(e instanceof CapacityInputError);
      assert.equal(e.code, 'INVALID_CAPACITY_INPUT');
    }
  });
});

describe('capacityMetrics', () => {
  const snapshot = {
    dbBytes: 21 * GB,
    largestTable: { name: 'sync_log', approxRows: 1_000 },
    activeTenants: 10_000,
    syncP95Ms: null,
  };

  it('scores each ADR-068 trigger once, in a fixed order', () => {
    const m = capacityMetrics(snapshot);
    assert.deepEqual(
      m.map((x) => [x.key, x.status]),
      [
        ['dbSizeS2', 'amber'],
        ['largestTableRows', 'ok'],
        ['syncP95', 'sin-datos'],
        ['dbSizeS3', 'ok'],
        ['activeTenants', 'red'],
      ],
    );
    assert.equal(m.find((x) => x.key === 'dbSizeS3')?.trigger, CAPACITY_TRIGGERS.dbBytesS3);
  });

  it('treats an empty database (no tables yet) as zero rows', () => {
    const m = capacityMetrics({ ...snapshot, largestTable: null });
    assert.equal(m.find((x) => x.key === 'largestTableRows')?.value, 0);
  });

  it('worstStatus ranks red over amber over ok, and ignores sin-datos', () => {
    const m = capacityMetrics(snapshot);
    assert.equal(worstStatus(m), 'red');
    assert.equal(worstStatus(m.filter((x) => x.status !== 'red')), 'amber');
    assert.equal(worstStatus(m.filter((x) => x.status === 'sin-datos')), 'sin-datos');
    assert.equal(worstStatus([]), 'sin-datos');
  });
});
