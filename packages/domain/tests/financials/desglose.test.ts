import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  calculateEstadoDeResultados,
  desgloseDeResultados,
  type Expense,
  type Sale,
} from '../../src/index.js';

const venta = (metodo: string, monto: bigint) => ({ metodo, monto }) as unknown as Sale;
const gasto = (categoria: string, monto: bigint) => ({ categoria, monto }) as unknown as Expense;

const ventas = [venta('Efectivo', 7500n), venta('Tarjeta', 12000n), venta('Efectivo', 25000n)];
const egresos = [
  gasto('Materia Prima', 42000n),
  gasto('Servicios', 34000n),
  gasto('Nómina', 815000n),
  gasto('Inventario', 180000n),
  gasto('Servicios', 1000n),
];

describe('desgloseDeResultados', () => {
  it('groups by method and category, largest first', () => {
    const d = desgloseDeResultados({ ventas, egresos });
    assert.deepEqual(d.ingresos, [
      { clave: 'Efectivo', monto: 32500n },
      { clave: 'Tarjeta', monto: 12000n },
    ]);
    assert.deepEqual(d.costoDeVentas, [
      { clave: 'Inventario', monto: 180000n },
      { clave: 'Materia Prima', monto: 42000n },
    ]);
    assert.deepEqual(
      d.gastosOperativos.map((p) => p.clave),
      ['Nómina', 'Servicios'],
    );
  });

  it('each breakdown adds up to its statement line exactly', () => {
    const d = desgloseDeResultados({ ventas, egresos });
    const er = calculateEstadoDeResultados({ ventas, egresos, isrTasa: 125 });
    const total = (ps: readonly { monto: bigint }[]) => ps.reduce((t, p) => t + p.monto, 0n);
    assert.equal(total(d.ingresos), er.ingresos);
    assert.equal(total(d.costoDeVentas), er.costoDeVentas);
    assert.equal(total(d.gastosOperativos), er.gastosOperativos);
  });

  it('an empty period has empty breakdowns', () => {
    assert.deepEqual(desgloseDeResultados({ ventas: [], egresos: [] }), {
      ingresos: [],
      costoDeVentas: [],
      gastosOperativos: [],
    });
  });
});
