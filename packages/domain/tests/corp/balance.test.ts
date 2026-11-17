import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  balanceGeneral,
  cuentasDelGrupo,
  type SumaDeCuenta,
} from '../../src/corp/balance/index.js';
import { MontoInvalidoError } from '../../src/corp/ledger/errors.js';

/**
 * E-12's balance sheet. The fixture is board CD-08's 31 October, worked by
 * hand from net balances:
 *
 *   activo  96,638.50 + 16,002.00 + 5,316.80 + 480.00            = 118,437.30
 *   pasivo   3,480.00 + 2,207.17 + 1,066.67 + 10,000.00          =  16,753.84
 *   capital 12,000.00 + 120,000.00 + 0 + (7,350.00 − 37,666.54)  = 101,683.46
 *
 * and 16,753.84 + 101,683.46 = 118,437.30.
 */
const suma = (
  cuenta: string,
  lado: { debe?: bigint; haber?: bigint },
  previo = false,
  entryId = `E-${cuenta}`,
): SumaDeCuenta => ({ cuenta, previo, debe: lado.debe ?? 0n, haber: lado.haber ?? 0n, entryId });

const OCTUBRE: readonly SumaDeCuenta[] = [
  suma('bancos', { debe: 15_000_000n, haber: 5_336_150n }),
  suma('stripe_por_depositar', { debe: 1_600_200n }),
  suma('iva_acreditable', { debe: 531_680n }),
  suma('iva_por_acreditar', { debe: 48_000n }),
  suma('proveedores', { haber: 348_000n }),
  suma('iva_trasladado', { haber: 220_717n }),
  suma('retenciones_por_pagar', { haber: 106_667n }),
  suma('prestamos_socios', { haber: 1_000_000n }),
  suma('capital_social', { haber: 1_200_000n }),
  suma('afac', { haber: 12_000_000n }),
  suma('ingresos', { haber: 735_000n }),
  suma('costo_servicio', { debe: 2_000_000n }),
  suma('administracion', { debe: 1_766_654n }),
];

describe('balanceGeneral', () => {
  it("balances board CD-08's October to the centavo", () => {
    const b = balanceGeneral(OCTUBRE);
    assert.equal(b.activo.total, 11_843_730n);
    assert.equal(b.pasivo.total, 1_675_384n);
    assert.equal(b.capital.resultadoDelEjercicio, -3_031_654n);
    assert.equal(b.capital.total, 10_168_346n);
    assert.equal(b.diferencia, 0n);
    assert.deepEqual(b.sinClasificar, []);
    assert.equal(b.vacio, false);
    assert.equal(b.activo.saldos.get('bancos'), 9_663_850n);
    assert.equal(b.pasivo.saldos.get('proveedores'), 348_000n);
  });

  it('lists every account of each group in the chart order, zeros included', () => {
    const b = balanceGeneral(OCTUBRE);
    assert.deepEqual([...b.activo.saldos.keys()], cuentasDelGrupo('activo'));
    assert.deepEqual([...b.pasivo.saldos.keys()], cuentasDelGrupo('pasivo'));
    assert.deepEqual(
      [...b.capital.saldos.keys()],
      ['capital_social', 'afac', 'resultados_acumulados'],
    );
    assert.equal(b.pasivo.saldos.get('isr_por_pagar'), 0n);
  });

  it("puts a past year's result in resultados acumulados, not in the year's", () => {
    const b = balanceGeneral([
      ...OCTUBRE,
      suma('bancos', { debe: 50_000n }, true),
      suma('ingresos', { haber: 50_000n }, true),
    ]);
    assert.equal(b.capital.saldos.get('resultados_acumulados'), 50_000n);
    assert.equal(b.capital.resultadoDelEjercicio, -3_031_654n);
    assert.equal(b.diferencia, 0n);
  });

  it('does not balance when a line uses an account outside the chart, and names it', () => {
    const b = balanceGeneral([
      ...OCTUBRE,
      suma('caja_chica', { debe: 48_000n }, false, 'E-24OCT'),
      suma('bancos', { haber: 48_000n }, false, 'E-24OCT'),
    ]);
    assert.equal(b.diferencia, -48_000n);
    assert.deepEqual(b.sinClasificar, [{ cuenta: 'caja_chica', entryId: 'E-24OCT' }]);
  });

  it('does not balance sums that do not add up, with nothing to name', () => {
    const b = balanceGeneral([...OCTUBRE, suma('bancos', { debe: 100n })]);
    assert.equal(b.diferencia, 100n);
    assert.deepEqual(b.sinClasificar, []);
  });

  it('is empty, and balances, with no movements at all', () => {
    const b = balanceGeneral([]);
    assert.equal(b.vacio, true);
    assert.equal(b.activo.total, 0n);
    assert.equal(b.capital.total, 0n);
    assert.equal(b.diferencia, 0n);
  });

  it('refuses a negative sum', () => {
    assert.throws(() => balanceGeneral([suma('bancos', { debe: -1n })]), MontoInvalidoError);
  });
});

describe('cuentasDelGrupo', () => {
  it("is the chart's own order and nothing outside the group", () => {
    assert.deepEqual(cuentasDelGrupo('activo'), [
      'bancos',
      'stripe_por_depositar',
      'iva_acreditable',
      'iva_por_acreditar',
    ]);
    assert.equal(cuentasDelGrupo('pasivo').length, 6);
  });
});
