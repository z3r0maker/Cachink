import { describe, expect, it } from 'vitest';
import type { RejectedRow } from '@xangarro/sync';
import { describeRejectedRow } from '../../../src/screens/SyncRejected/describe-rejected-row';

function rejected(over: Partial<RejectedRow> = {}): RejectedRow {
  return {
    tableName: 'sales',
    rowId: 'S1',
    code: 'FK_PRODUCT_MISSING',
    message: 'productoId=P1 not found',
    retryable: false,
    attempts: 1,
    lastAttemptAt: '2026-09-16T14:32:00.000Z',
    row: { monto: 12000n, concepto: 'Tacos', fecha: '2026-09-16' },
    ...over,
  };
}

describe('describeRejectedRow', () => {
  it('summarises a sale with amount, concept and date', () => {
    const v = describeRejectedRow(rejected());
    expect(v.kindKey).toBe('noEnviados.kinds.venta');
    expect(v.detail).toBe('$120.00 · Tacos · 2026-09-16');
  });

  it('uses the catalog reason and the deleted-product hint', () => {
    const v = describeRejectedRow(rejected());
    expect(v.reasonKey).toBe('sync.errors.fkProduct');
    expect(v.hintKey).toBe('noEnviados.hints.productMissing');
    expect(v.retrying).toBe(false);
  });

  it('keeps the server message when the code is unknown to this app version', () => {
    const v = describeRejectedRow(rejected({ code: 'SOMETHING_NEW', message: 'raro' }));
    expect(v.reasonKey).toBe('');
    expect(v.fallbackMessage).toBe('raro');
    expect(v.hintKey).toBeNull();
  });

  it('still renders when the row no longer exists locally', () => {
    const v = describeRejectedRow(rejected({ tableName: 'mystery', row: null, retryable: true }));
    expect(v.kindKey).toBe('noEnviados.kinds.otro');
    expect(v.detail).toBe('');
    expect(v.retrying).toBe(true);
  });
});

describe('sync error catalog translations', () => {
  it('has an es-MX string for every per-row and transport error key', async () => {
    const { ERROR_CATALOG } = await import('@xangarro/contracts');
    const { i18n, initI18n } = await import('../../../src/i18n/index');
    initI18n();
    for (const entry of Object.values(ERROR_CATALOG)) {
      expect(i18n.exists(entry.userMessageKey), entry.userMessageKey).toBe(true);
    }
  });
});
