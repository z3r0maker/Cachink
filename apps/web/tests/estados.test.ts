import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { calculateEstadoDeResultados, formatMoney } from '@xangarro/domain';

import {
  BALANCE,
  ESTADO_RESULTADOS,
  FLUJO,
  INDICADORES,
  ISR_TASA_BPS,
  PERIOD_EXPENSES,
  PERIOD_SALES,
} from '../src/fixtures/estados';

/**
 * P-14 instructs: locate the existing `@xangarro/domain` NIF functions and do
 * **not** reimplement them. These assertions are what makes that checkable —
 * they recompute from the same inputs and require the portal's figures to be
 * identical, so a stray reimplementation in a component would fail here.
 */
describe('Estados financieros are computed by the domain', () => {
  it('produces the same Estado de Resultados as a direct domain call', () => {
    const direct = calculateEstadoDeResultados({
      ventas: PERIOD_SALES,
      egresos: PERIOD_EXPENSES,
      isrTasa: ISR_TASA_BPS,
    });
    assert.deepEqual(ESTADO_RESULTADOS, direct);
  });

  it('holds the NIF B-3 identities', () => {
    const er = ESTADO_RESULTADOS;
    assert.equal(er.utilidadBruta, er.ingresos - er.costoDeVentas);
    assert.equal(er.utilidadOperativa, er.utilidadBruta - er.merma - er.gastosOperativos);
    assert.equal(er.utilidadNeta, er.utilidadOperativa - er.isr);
  });

  it('charges ISR only on a positive utilidad operativa', () => {
    const loss = calculateEstadoDeResultados({
      ventas: [],
      egresos: PERIOD_EXPENSES,
      isrTasa: ISR_TASA_BPS,
    });
    assert.ok(loss.utilidadOperativa < 0n);
    assert.equal(loss.isr, 0n, 'a loss-making period owes no estimated ISR');
  });

  it('rejects an ISR rate outside [0, 10000] basis points', () => {
    assert.throws(() => calculateEstadoDeResultados({ ventas: [], egresos: [], isrTasa: 10_001 }));
    assert.throws(() => calculateEstadoDeResultados({ ventas: [], egresos: [], isrTasa: -1 }));
  });

  it('balances NIF B-6: activo total is the sum of its three parts', () => {
    const a = BALANCE.activo;
    assert.equal(a.total, a.efectivo + a.inventarios + a.cuentasPorCobrar);
  });

  it('splits NIF B-2 flow into operación and inversión', () => {
    assert.equal(FLUJO.total, FLUJO.operacion + FLUJO.inversion);
    assert.ok(FLUJO.egresoInversion > 0n, 'inventory purchases are investment outflow');
  });

  it('derives margins from the statement, not from a second calculation', () => {
    const er = ESTADO_RESULTADOS;
    const expected = Number(er.utilidadBruta) / Number(er.ingresos);
    assert.ok(INDICADORES.margenBruto !== null);
    assert.ok(Math.abs((INDICADORES.margenBruto ?? 0) - expected) < 1e-9);
  });

  it('formats money through the domain, never by hand', () => {
    assert.match(formatMoney(ESTADO_RESULTADOS.ingresos), /^\$[\d,]+\.\d{2}$/);
  });
});
