import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  calculateEstadoDeResultados,
  desgloseDeResultados,
  type Sale,
  type Expense,
} from '@xangarro/domain';

import {
  donutEgresos,
  donutIngresos,
  waterfallDeResultados,
} from '../src/app/(portal)/estados/charts-data';

const venta = (
  metodo: Sale['metodo'],
  monto: bigint,
  categoria: Sale['categoria'] = 'Producto',
): Sale =>
  ({
    id: '01J-V',
    productoId: '01J-P',
    fecha: '2026-05-01',
    hora: null,
    concepto: 'x',
    categoria,
    monto,
    metodo,
    estadoPago: 'pagado',
    cantidad: 1,
  }) as unknown as Sale;

const gasto = (categoria: Expense['categoria'], monto: bigint): Expense =>
  ({ id: '01J-E', fecha: '2026-05-01', concepto: 'x', categoria, monto }) as unknown as Expense;

const ER = calculateEstadoDeResultados({
  ventas: [venta('Efectivo', 100_000n), venta('Crédito', 40_000n)],
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
    assert.equal(neta?.base, 0, 'the final level is anchored to zero');
    assert.equal(neta?.delta, Number(ER.utilidadNeta));
  });

  it('a resta bar floats between the levels it joins', () => {
    const steps = waterfallDeResultados(ER);
    const costo = steps.find((s) => s.label === 'Costo de ventas');
    assert.equal(costo?.base, Number(ER.utilidadBruta), 'the drop starts where bruta ends');
    assert.equal(costo?.delta, Number(ER.costoDeVentas));
  });

  it('omits zero steps — no merma month draws no merma bar', () => {
    assert.ok(waterfallDeResultados(ER).every((s) => s.delta !== 0));
    const sinGastos = calculateEstadoDeResultados({
      ventas: [venta('Efectivo', 100n)],
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
      slices.reduce((a, s) => a + s.value, 0),
      Number(ER.ingresos),
    );
  });

  it('egresos slices join costo and operativo categories', () => {
    const slices = donutEgresos(desglose);
    assert.deepEqual(
      slices.map((s) => s.label),
      ['Materia Prima', 'Renta'],
    );
    assert.equal(
      slices.reduce((a, s) => a + s.value, 0),
      30_000 + 20_000,
    );
  });

  it('an empty period yields no slices, not a zero slice', () => {
    assert.deepEqual(donutIngresos(desgloseDeResultados({ ventas: [], egresos: [] })), []);
  });
});
