import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  AsientoDesbalanceadoError,
  MontoInvalidoError,
  MotivoRequeridoError,
  postMovement,
  sumDebe,
  sumHaber,
  type JournalLine,
  type Movement,
} from '../../src/corp/ledger/index.js';

/**
 * E-02 (ADR-124 §4): a founder captures a movement, the ledger posts balanced
 * lines. Every movement type must balance; the interesting ones are checked
 * line by line.
 */
const pick = (lines: readonly JournalLine[], cuenta: string) =>
  lines.filter((l) => l.cuenta === cuenta);

const ALL: readonly Movement[] = [
  { kind: 'cobro', subtotal: 38_400_00n, iva: 6_144_00n, destino: 'stripe_por_depositar' },
  { kind: 'payout', bruto: 12_470_00n, comision: 470_00n },
  {
    kind: 'gasto',
    categoria: 'administracion',
    subtotal: 3_500_00n,
    iva: 560_00n,
    tratamientoIva: 'acreditable',
    retencionIsr: 350_00n,
    retencionIva: 373_33n,
    pagado: true,
  },
  { kind: 'pago_impuestos', isr: 3_875_00n, iva: 2_944_00n, retenciones: 723_33n },
  { kind: 'aportacion_capital', socio: 1, monto: 6_000_00n },
  { kind: 'aportacion_adicional', socio: 1, monto: 20_000_00n },
  { kind: 'prestamo_socio', socio: 1, monto: 10_000_00n },
  { kind: 'reembolso_socio', socio: 1, monto: 10_000_00n },
  { kind: 'comision_bancaria', monto: 450_00n },
];

describe('postMovement', () => {
  it('balances every movement type', () => {
    for (const m of ALL) {
      const lines = postMovement(m);
      assert.ok(lines.length >= 2, m.kind);
      assert.equal(sumDebe(lines), sumHaber(lines), m.kind);
    }
  });

  it('posts a subscription payment to income and IVA trasladado', () => {
    const lines = postMovement(ALL[0]!);
    assert.equal(pick(lines, 'stripe_por_depositar')[0]?.debe, 44_544_00n);
    assert.equal(pick(lines, 'ingresos')[0]?.haber, 38_400_00n);
    assert.equal(pick(lines, 'iva_trasladado')[0]?.haber, 6_144_00n);
  });

  it('posts an expense with withholdings: the bank pays the net, the rest is owed to SAT', () => {
    const lines = postMovement(ALL[2]!);
    assert.equal(pick(lines, 'administracion')[0]?.debe, 3_500_00n);
    assert.equal(pick(lines, 'iva_acreditable')[0]?.debe, 560_00n);
    assert.equal(pick(lines, 'retenciones_por_pagar')[0]?.haber, 723_33n);
    assert.equal(pick(lines, 'bancos')[0]?.haber, 3_336_67n);
  });

  it('turns IVA that cannot be credited into cost, and an unpaid invoice into a payable', () => {
    const lines = postMovement({
      kind: 'gasto',
      categoria: 'costo_servicio',
      subtotal: 1_000_00n,
      iva: 160_00n,
      tratamientoIva: 'no_acreditable',
      retencionIsr: 0n,
      retencionIva: 0n,
      pagado: false,
    });
    assert.equal(pick(lines, 'costo_servicio')[0]?.debe, 1_160_00n);
    assert.equal(pick(lines, 'iva_acreditable').length, 0);
    assert.equal(pick(lines, 'proveedores')[0]?.haber, 1_160_00n);
  });

  it('records a partner loan as a liability of that partner', () => {
    const [banco, prestamo] = postMovement(ALL[6]!);
    assert.equal(banco?.cuenta, 'bancos');
    assert.equal(prestamo?.cuenta, 'prestamos_socios');
    assert.equal(prestamo?.socio, 1);
    assert.equal(prestamo?.haber, 10_000_00n);
  });

  it('refuses a zero or negative amount', () => {
    assert.throws(() => postMovement({ kind: 'comision_bancaria', monto: 0n }), MontoInvalidoError);
    assert.throws(
      () => postMovement({ kind: 'aportacion_capital', socio: 2, monto: -1n }),
      MontoInvalidoError,
    );
  });

  it('refuses withholdings larger than the invoice', () => {
    assert.throws(
      () =>
        postMovement({
          kind: 'gasto',
          categoria: 'administracion',
          subtotal: 100_00n,
          iva: 16_00n,
          tratamientoIva: 'acreditable',
          retencionIsr: 100_00n,
          retencionIva: 20_00n,
          pagado: true,
        }),
      MontoInvalidoError,
    );
  });

  it('accepts a founder adjustment only when it balances and says why', () => {
    const ajuste = (motivo: string, haber: bigint): Movement => ({
      kind: 'ajuste',
      motivo,
      lines: [
        { cuenta: 'bancos', debe: 100_00n, haber: 0n },
        { cuenta: 'financiero', debe: 0n, haber },
      ],
    });
    assert.equal(postMovement(ajuste('Saldo del banco', 100_00n)).length, 2);
    assert.throws(() => postMovement(ajuste('Saldo del banco', 99_00n)), AsientoDesbalanceadoError);
    assert.throws(() => postMovement(ajuste('   ', 100_00n)), MotivoRequeridoError);
  });
});
