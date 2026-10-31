import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  MontoInvalidoError,
  postMovement,
  sumDebe,
  sumHaber,
  type Gasto,
  type JournalLine,
} from '../../src/corp/ledger/index.js';

/**
 * Owner decision 9 (2026-10-29): an invoice on credit (PPD) posts in its own
 * month, owed to the supplier, and its IVA becomes creditable only when paid.
 * The withholdings are made when paying, so they post with the payment.
 */
const pick = (lines: readonly JournalLine[], cuenta: string) =>
  lines.filter((l) => l.cuenta === cuenta);

const HONORARIOS: Gasto = {
  kind: 'gasto',
  categoria: 'administracion',
  subtotal: 3_500_00n,
  iva: 560_00n,
  tratamientoIva: 'acreditable',
  retencionIsr: 350_00n,
  retencionIva: 373_33n,
  pagado: false,
};

describe('an invoice on credit (E-11, owner decision 9)', () => {
  it('posts the expense owed in full, its IVA pending, and no withholding yet', () => {
    const lines = postMovement(HONORARIOS);
    assert.equal(pick(lines, 'administracion')[0]?.debe, 3_500_00n);
    assert.equal(pick(lines, 'iva_por_acreditar')[0]?.debe, 560_00n);
    assert.equal(pick(lines, 'iva_acreditable').length, 0);
    assert.equal(pick(lines, 'retenciones_por_pagar').length, 0);
    assert.equal(pick(lines, 'proveedores')[0]?.haber, 4_060_00n);
    assert.equal(pick(lines, 'bancos').length, 0);
  });

  it('pays it: the bank pays the net, the withholdings are owed, the IVA becomes creditable', () => {
    const lines = postMovement({
      kind: 'pago_proveedor',
      total: 4_060_00n,
      ivaPorAcreditar: 560_00n,
      retencionIsr: 350_00n,
      retencionIva: 373_33n,
    });
    assert.equal(pick(lines, 'proveedores')[0]?.debe, 4_060_00n);
    assert.equal(pick(lines, 'bancos')[0]?.haber, 3_336_67n);
    assert.equal(pick(lines, 'retenciones_por_pagar')[0]?.haber, 723_33n);
    assert.equal(pick(lines, 'iva_acreditable')[0]?.debe, 560_00n);
    assert.equal(pick(lines, 'iva_por_acreditar')[0]?.haber, 560_00n);
    assert.equal(sumDebe(lines), sumHaber(lines));
  });

  it('pays an invoice without creditable IVA without touching the IVA accounts', () => {
    const lines = postMovement({
      kind: 'pago_proveedor',
      total: 1_160_00n,
      ivaPorAcreditar: 0n,
      retencionIsr: 0n,
      retencionIva: 0n,
    });
    assert.deepEqual(
      lines.map((l) => l.cuenta),
      ['proveedores', 'bancos'],
    );
  });

  it('refuses a payment of nothing, withholdings that eat it, or more IVA than the invoice', () => {
    const pago = { kind: 'pago_proveedor', ivaPorAcreditar: 0n, retencionIva: 0n } as const;
    assert.throws(() => postMovement({ ...pago, total: 0n, retencionIsr: 0n }), MontoInvalidoError);
    assert.throws(
      () => postMovement({ ...pago, total: 100_00n, retencionIsr: 100_00n }),
      MontoInvalidoError,
    );
    assert.throws(
      () => postMovement({ ...pago, total: 100_00n, retencionIsr: 0n, ivaPorAcreditar: 101_00n }),
      MontoInvalidoError,
    );
  });
});
