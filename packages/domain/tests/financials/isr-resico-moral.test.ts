import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  calcularIsrPorRegimen,
  isrResicoMensual,
  metodoIsr,
} from '../../src/financials/isr-regimen.js';
import { calculateEstadoDeResultados } from '../../src/financials/estado-resultados.js';
import type { Expense, Sale } from '../../src/entities/index.js';

const venta = (monto: bigint): Sale =>
  ({ fecha: '2026-05-01', monto, metodo: 'Efectivo', estadoPago: 'pagado' }) as unknown as Sale;
const gasto = (monto: bigint): Expense =>
  ({ fecha: '2026-05-01', concepto: 'x', categoria: 'Servicios', monto }) as unknown as Expense;

/**
 * RESICO de personas morales (LISR Título VII, Capítulo XII, arts. 206–215):
 * the provisional payment is the Art. 9 rate (30 %) over the cash-basis
 * profit of the year so far, less the earlier payments (Art. 211). Nothing
 * like the persona física's flat rate over gross (Art. 113-E).
 */
describe('calcularIsrPorRegimen — 626 persona moral (Art. 211)', () => {
  it('30 % sobre la utilidad, no la tabla de ingresos de la persona física (happy)', () => {
    const r = calcularIsrPorRegimen({
      regimenSat: '626',
      persona: 'moral',
      ingresos: 10_000_000n,
      utilidad: 2_000_000n,
      isrTasa: 125,
    });
    assert.equal(r.metodo, 'resicoMoral');
    assert.equal(r.base, 'utilidad');
    assert.equal(r.isr, 600_000n, '$20,000 × 30% — the owner’s 1.25% is ignored');
    assert.notEqual(r.isr, isrResicoMensual(10_000_000n), 'not the 113-E table on gross');
  });

  it('a loss owes nothing: no ISR on gross for a persona moral (unhappy)', () => {
    const r = calcularIsrPorRegimen({
      regimenSat: '626',
      persona: 'moral',
      ingresos: 645_000n,
      utilidad: -160_650n,
      isrTasa: 125,
    });
    assert.equal(r.metodo, 'resicoMoral');
    assert.equal(r.isr, 0n);
  });

  it('a multi-month period is one cumulative base: months offset each other (unhappy)', () => {
    // Art. 211 accumulates from January and credits earlier payments, so the
    // period's total is 30 % of its total profit — never split per month.
    const r = calcularIsrPorRegimen({
      regimenSat: '626',
      persona: 'moral',
      ingresos: 50_000_000n,
      utilidad: 900_001n,
      isrTasa: 125,
      meses: 3,
    });
    assert.equal(r.isr, 270_000n, '(900,001 × 3000) ÷ 10,000, truncated to the centavo');
  });

  it('persona física, or no persona known, keeps the 113-E table on gross (unhappy)', () => {
    const entrada = { regimenSat: '626', ingresos: 645_000n, utilidad: -160_650n, isrTasa: 125 };
    for (const persona of ['fisica', null, undefined] as const) {
      const r = calcularIsrPorRegimen({ ...entrada, persona });
      assert.equal(r.metodo, 'resico', `persona ${String(persona)}`);
      assert.equal(r.base, 'ingresos');
      assert.equal(r.isr, 6_450n);
    }
  });

  it('persona moral changes nothing outside 626 (unhappy)', () => {
    const r = calcularIsrPorRegimen({
      regimenSat: '601',
      persona: 'moral',
      ingresos: 0n,
      utilidad: 100_000n,
      isrTasa: 3000,
    });
    assert.equal(r.metodo, 'tasa');
    assert.equal(r.isr, 30_000n);
  });
});

describe('metodoIsr', () => {
  it('names the method each régime and persona is estimated with', () => {
    assert.equal(metodoIsr('626', 'moral'), 'resicoMoral');
    assert.equal(metodoIsr('626', 'fisica'), 'resico');
    assert.equal(metodoIsr('626', null), 'resico', 'unknown persona: the común case');
    assert.equal(metodoIsr('612', 'fisica'), 'tarifa96');
    assert.equal(metodoIsr('601', 'moral'), 'tasa');
    assert.equal(metodoIsr(null, null), 'tasa');
  });
});

describe('calculateEstadoDeResultados with a persona', () => {
  it('passes the persona through to the ISR line (and only that line)', () => {
    const base = { ventas: [venta(5_000_000n)], egresos: [gasto(3_000_000n)], isrTasa: 125 };
    const moral = calculateEstadoDeResultados({ ...base, regimenSat: '626', persona: 'moral' });
    assert.equal(moral.utilidadOperativa, 2_000_000n);
    assert.equal(moral.isr, 600_000n);
    assert.equal(moral.utilidadNeta, 1_400_000n);

    const fisica = calculateEstadoDeResultados({ ...base, regimenSat: '626', persona: 'fisica' });
    assert.equal(fisica.isr, isrResicoMensual(5_000_000n));
  });
});
