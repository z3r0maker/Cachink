import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { calculateEstadoDeResultados, desgloseDeResultados, type Expense } from '@xangarro/domain';

import {
  donutEgresos,
  donutIngresos,
  waterfallDeResultados,
} from '../src/app/(portal)/estados/charts-data';

/** A ticket projection (ADR-073): method on the header, total derived. */
const venta = (metodo: string, monto: bigint, _categoria: string = 'Producto'): never =>
  ({
    ticket: { id: '01J-V', metodo, fecha: '2026-05-01' },
    total: monto,
  }) as never;

const gasto = (categoria: Expense['categoria'], monto: bigint): Expense =>
  ({ id: '01J-E', fecha: '2026-05-01', concepto: 'x', categoria, monto }) as unknown as Expense;

const ER = calculateEstadoDeResultados({
  ventas: [{ monto: 100_000n }, { monto: 40_000n }] as never,
  egresos: [gasto('Materia Prima', 30_000n), gasto('Renta', 20_000n)],
  isrTasa: 125,
});

describe('waterfallDeResultados', () => {
  it('walks the B-3 identities and lands on utilidad neta', () => {
    const steps = waterfallDeResultados(ER);
    const labels = steps.map((s) => s.label);
    assert.deepEqual(labels, [
      'Ingresos',
      'Costo de ventas',
      'Utilidad bruta',
      'Gastos operativos',
      'Utilidad operativa',
      'ISR',
      'Utilidad neta',
    ]);
    const neta = steps.at(-1);
    assert.equal(neta?.acumulado, ER.utilidadNeta);
    assert.equal(neta?.desde, 0n, 'the final level is anchored to zero');
    assert.equal(neta?.hasta, ER.utilidadNeta);
  });

  it('a resta bar floats between the levels it joins', () => {
    const steps = waterfallDeResultados(ER);
    const costo = steps.find((s) => s.label === 'Costo de ventas');
    // It hangs from ingresos down to utilidad bruta — the two levels it joins.
    assert.equal(costo?.desde, ER.ingresos, 'the drop starts at the level above it');
    assert.equal(costo?.hasta, ER.utilidadBruta, 'and lands on the level below');
    assert.equal(costo?.monto, ER.costoDeVentas);
    assert.equal(costo?.desde - costo?.hasta, costo?.monto, 'the span is the amount');
  });

  it('omits zero steps — no merma month draws no merma bar', () => {
    assert.ok(waterfallDeResultados(ER).every((s) => s.monto !== 0n));
    const sinGastos = calculateEstadoDeResultados({
      ventas: [{ monto: 100n }] as never,
      egresos: [],
      isrTasa: 0,
    });
    assert.ok(!waterfallDeResultados(sinGastos).some((s) => s.label === 'ISR'));
  });
});

describe('the donuts', () => {
  const desglose = desgloseDeResultados({
    ventas: [venta('Efectivo', 100_000n), venta('Crédito', 40_000n)],
    egresos: [gasto('Materia Prima', 30_000n), gasto('Renta', 20_000n)],
  });

  it('ingresos slices by method, largest first, summing to ingresos', () => {
    const slices = donutIngresos(desglose);
    assert.deepEqual(
      slices.map((s) => s.label),
      ['Efectivo', 'Crédito'],
    );
    assert.equal(
      slices.reduce((a, s) => a + s.monto, 0n),
      ER.ingresos,
    );
  });

  it('egresos slices join costo and operativo categories', () => {
    const slices = donutEgresos(desglose);
    assert.deepEqual(
      slices.map((s) => s.label),
      ['Materia Prima', 'Renta'],
    );
    assert.equal(
      slices.reduce((a, s) => a + s.monto, 0n),
      50_000n,
    );
  });

  it('an empty period yields no slices, not a zero slice', () => {
    assert.deepEqual(donutIngresos(desgloseDeResultados({ ventas: [], egresos: [] })), []);
  });
});
