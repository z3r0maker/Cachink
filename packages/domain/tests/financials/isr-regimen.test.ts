import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  calcularIsrPorRegimen,
  isrResicoMensual,
  isrTarifa96Mensual,
} from '../../src/financials/isr-regimen.js';
import { calculateEstadoDeResultados } from '../../src/financials/estado-resultados.js';
import type { Expense, Sale } from '../../src/entities/index.js';

const venta = (monto: bigint): Sale =>
  ({ fecha: '2026-05-01', monto, metodo: 'Efectivo', estadoPago: 'pagado' }) as unknown as Sale;
const gasto = (monto: bigint): Expense =>
  ({ fecha: '2026-05-01', concepto: 'x', categoria: 'Servicios', monto }) as unknown as Expense;

/** The published examples the tables must reproduce (Anexo 8 RMF 2026; 113-E). */
describe('isrResicoMensual (Art. 113-E: flat over gross)', () => {
  it('la tasa plana de cada rango sobre el monto completo (happy)', () => {
    assert.equal(isrResicoMensual(2_500_000n), 25_000n, '$25,000 × 1.00%');
    assert.equal(isrResicoMensual(5_000_000n), 55_000n, '$50,000 × 1.10%');
    assert.equal(isrResicoMensual(6_500_000n), 97_500n, '$65,000 × 1.50% — the published example');
    assert.equal(isrResicoMensual(20_833_333n), 416_666n, '$208,333.33 × 2.00%');
    assert.equal(isrResicoMensual(35_000_000n), 787_500n, '$350,000 × 2.25%');
    assert.equal(isrResicoMensual(50_000_000n), 1_250_000n, 'over $350,000 × 2.50%');
  });

  it('no income owes nothing, and a centavo above a limit takes the next bracket', () => {
    assert.equal(isrResicoMensual(0n), 0n);
    assert.equal(isrResicoMensual(2_500_001n), (2_500_001n * 110n) / 10_000n);
  });
});

describe('isrTarifa96Mensual (Art. 96: quota + marginal)', () => {
  it('reproduce los renglones de la propia tarifa (happy)', () => {
    // $10,000 falls in the $7,168.52–$12,598.02 row: 420.95 + 10.88% over 7,168.51.
    const esperado = 42_095n + ((1_000_000n - 716_852n) * 1_088n) / 10_000n;
    assert.equal(isrTarifa96Mensual(1_000_000n), esperado);
    // The top row: $500,000 → 133,488.54 + 35% over 425,642.00.
    assert.equal(
      isrTarifa96Mensual(50_000_000n),
      13_348_854n + ((50_000_000n - 42_564_200n) * 3_500n) / 10_000n,
    );
  });

  it('a base at or below zero owes nothing — losses do not carry negative ISR', () => {
    assert.equal(isrTarifa96Mensual(0n), 0n);
    assert.equal(isrTarifa96Mensual(-5_000n), 0n);
  });

  it('el primer rango no tiene cuota: bases chicas pagan solo el marginal', () => {
    assert.equal(isrTarifa96Mensual(50_000n), (50_000n * 192n) / 10_000n);
  });
});

describe('calcularIsrPorRegimen', () => {
  it('RESICO grava ingresos incluso en un mes con pérdida — el punto de F-2 (happy)', () => {
    const r = calcularIsrPorRegimen({
      regimenSat: '626',
      ingresos: 645_000n,
      utilidad: -160_650n,
      isrTasa: 125,
    });
    assert.equal(r.metodo, 'resico');
    assert.equal(r.base, 'ingresos');
    assert.equal(r.isr, 6_450n, '$6,450 gross × 1.00%');
  });

  it('a trimestre spreads across months and multiplies back', () => {
    // $150,000 over 3 months = $50,000/mes → 1.10% → ×3.
    const r = calcularIsrPorRegimen({
      regimenSat: '626',
      ingresos: 15_000_000n,
      utilidad: 0n,
      isrTasa: 125,
      meses: 3,
    });
    assert.equal(r.isr, 165_000n);
  });

  it('612 applies the tariff to profit; a loss month owes zero', () => {
    const conUtilidad = calcularIsrPorRegimen({
      regimenSat: '612',
      ingresos: 10_000_000n,
      utilidad: 3_000_000n,
      isrTasa: 3000,
    });
    assert.equal(conUtilidad.metodo, 'tarifa96');
    assert.equal(
      conUtilidad.isr,
      isrTarifa96Mensual(3_000_000n),
      'la tasa del dueño se ignora para 612',
    );
    const enPerdida = calcularIsrPorRegimen({
      regimenSat: '612',
      ingresos: 10_000_000n,
      utilidad: -1n,
      isrTasa: 3000,
    });
    assert.equal(enPerdida.isr, 0n);
  });

  it('cualquier otro régimen — y ninguno — conserva la tasa del dueño (unhappy)', () => {
    assert.equal(
      calcularIsrPorRegimen({ regimenSat: '621', ingresos: 0n, utilidad: 100_000n, isrTasa: 200 })
        .isr,
      2_000n,
    );
    assert.equal(
      calcularIsrPorRegimen({ regimenSat: null, ingresos: 0n, utilidad: 100_000n, isrTasa: 3000 })
        .isr,
      30_000n,
    );
    assert.equal(
      calcularIsrPorRegimen({ regimenSat: '601', ingresos: 0n, utilidad: -50_000n, isrTasa: 3000 })
        .isr,
      0n,
      'una pérdida con la tasa del dueño no paga nada, como siempre',
    );
  });
});

describe('calculateEstadoDeResultados with a régime', () => {
  const base = { ventas: [venta(645_000n)], egresos: [gasto(1_606_500n)] };

  it('626 cambia la línea de ISR (y solo esa); sin régimen no cambia nada', () => {
    const resico = calculateEstadoDeResultados({ ...base, isrTasa: 125, regimenSat: '626' });
    assert.equal(resico.isr, 6_450n);
    assert.equal(resico.utilidadNeta, resico.utilidadOperativa - 6_450n);

    const sinRegimen = calculateEstadoDeResultados({ ...base, isrTasa: 125 });
    assert.equal(sinRegimen.isr, 0n, 'el camino del teléfono queda igual que antes');
    assert.equal(sinRegimen.utilidadNeta, sinRegimen.utilidadOperativa);
  });

  it('multi-month periods use the monthly tables per month', () => {
    const trimestral = calculateEstadoDeResultados({
      ...base,
      isrTasa: 125,
      regimenSat: '626',
      mesesEnPeriodo: 3,
    });
    // $6,450 over 3 months = $2,150/mes → still 1.00% → ×3 = same total here.
    assert.equal(trimestral.isr, 6_450n);
  });
});
