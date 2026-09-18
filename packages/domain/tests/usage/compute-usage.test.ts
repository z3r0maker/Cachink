import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { computeUsage, InvalidUsagePeriodError, type UsageRecord } from '../../src/usage/index.js';

const SEP = '2026-09-10T18:00:00.000Z';
const AUG = '2026-08-10T18:00:00.000Z';

describe('computeUsage', () => {
  it('counts the period transactions and the active products', () => {
    const records: UsageRecord[] = [
      { kind: 'ticket', at: SEP },
      { kind: 'ventaLinea', at: SEP, ticketId: 'T1' },
      { kind: 'ventaLinea', at: SEP, ticketId: 'T1' },
      { kind: 'gasto', at: SEP },
      { kind: 'movimientoInventario', at: SEP, origen: 'manual' },
      { kind: 'movimientoInventario', at: SEP, origen: 'venta' },
      { kind: 'abono', at: SEP },
      { kind: 'producto', deletedAt: null },
      { kind: 'producto', deletedAt: null, estadoRevision: 'aprobado' },
    ];
    assert.deepEqual(computeUsage(records, '2026-09'), { transactions: 3, activeProducts: 2 });
  });

  it('ignores transactions from other periods', () => {
    const records: UsageRecord[] = [
      { kind: 'ticket', at: AUG },
      { kind: 'gasto', at: '2026-09-01T05:30:00.000Z' }, // 31 Aug local
      { kind: 'gasto', at: SEP },
    ];
    assert.equal(computeUsage(records, '2026-09').transactions, 1);
    assert.equal(computeUsage(records, '2026-08').transactions, 2);
  });

  it('does not count archived, rejected or merged products', () => {
    const records: UsageRecord[] = [
      { kind: 'producto', deletedAt: '2026-09-01T00:00:00.000Z' },
      { kind: 'producto', deletedAt: null, estadoRevision: 'rechazado' },
      { kind: 'producto', deletedAt: null, estadoRevision: 'fusionado' },
      { kind: 'producto', deletedAt: null, estadoRevision: 'pendiente' },
    ];
    assert.equal(computeUsage(records, '2026-09').activeProducts, 1);
  });

  it('returns zeros for no records', () => {
    assert.deepEqual(computeUsage([], '2026-09'), { transactions: 0, activeProducts: 0 });
  });

  it('rejects a malformed period with a typed error', () => {
    assert.throws(() => computeUsage([], '2026/09'), InvalidUsagePeriodError);
  });

  it('uses the given time zone to place records', () => {
    const records: UsageRecord[] = [{ kind: 'gasto', at: '2026-09-01T05:30:00.000Z' }];
    assert.equal(computeUsage(records, '2026-09', 'UTC').transactions, 1);
  });
});
