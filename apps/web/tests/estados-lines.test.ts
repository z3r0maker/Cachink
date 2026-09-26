import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  activoLines,
  flujoLines,
  pasivoLines,
  resultadosLines,
} from '../src/app/(portal)/estados/lines';

/**
 * The statement line lists (P-14, NIF B-3 / B-6 / B-2).
 *
 * These look like plain data, and the data *is* the statement: the order is
 * the NIF's, `total` marks the subtotals a reader follows down the page, and
 * `negative` is what renders a figure in parentheses — a subtraction. Get one
 * of those wrong and the arithmetic on screen stops adding up while every
 * number remains correct, which is the kind of defect nobody reports because
 * it looks like a formatting choice.
 *
 * The amounts are passed straight through; what is asserted here is the shape
 * around them.
 */
const peso = (n: number) => BigInt(n) * 100n;

const ER = {
  ingresos: peso(100),
  costoDeVentas: peso(40),
  utilidadBruta: peso(60),
  gastosOperativos: peso(25),
  utilidadOperativa: peso(35),
  isr: peso(5),
  utilidadNeta: peso(30),
} as unknown as Parameters<typeof resultadosLines>[0];

const D = {
  ingresos: [{ clave: 'Tacos', monto: peso(70) }],
  costoDeVentas: [{ clave: 'Carne', monto: peso(40) }],
  gastosOperativos: [{ clave: 'Renta', monto: peso(25) }],
} as unknown as Parameters<typeof resultadosLines>[1];

const BALANCE = {
  activo: {
    efectivo: peso(10),
    inventarios: peso(20),
    cuentasPorCobrar: peso(5),
    total: peso(35),
  },
  pasivo: { total: peso(8) },
  capital: { utilidadDelPeriodo: peso(27), total: peso(27) },
} as unknown as Parameters<typeof activoLines>[0];

const FLUJO = {
  cobroVentasContado: peso(60),
  cobroCreditoClientes: peso(10),
  egresoOperativo: peso(25),
  operacion: peso(45),
  egresoInversion: peso(15),
  inversion: peso(-15),
  total: peso(30),
} as unknown as Parameters<typeof flujoLines>[0];

const labels = (lines: readonly { readonly label: string }[]) => lines.map((l) => l.label);

describe('resultadosLines (NIF B-3)', () => {
  const lines = resultadosLines(ER, D);

  it('runs top to bottom in the statement’s own order', () => {
    assert.deepEqual(labels(lines), [
      'Ingresos',
      'Costo de ventas',
      'Utilidad bruta',
      'Gastos operativos',
      'Utilidad operativa',
      'ISR',
      'Utilidad neta',
    ]);
  });

  it('marks as subtractions exactly what is subtracted', () => {
    // Not «the ones with negative amounts»: every figure here is positive, and
    // the parentheses are what say it comes off the total.
    assert.deepEqual(labels(lines.filter((l) => l.negative)), [
      'Costo de ventas',
      'Gastos operativos',
      'ISR',
    ]);
  });

  it('marks as totals the three the reader follows down the page', () => {
    assert.deepEqual(labels(lines.filter((l) => l.total)), [
      'Utilidad bruta',
      'Utilidad operativa',
      'Utilidad neta',
    ]);
  });

  it('only the lines with a breakdown carry one, from the desglose', () => {
    // The disclosure toggle renders on the presence of `detalle`, so a subtotal
    // that grew one would offer to open into nothing.
    assert.deepEqual(labels(lines.filter((l) => l.detalle !== undefined)), [
      'Ingresos',
      'Costo de ventas',
      'Gastos operativos',
    ]);
    assert.deepEqual(lines[0]?.detalle, [{ label: 'Tacos', amount: peso(70) }]);
  });

  it('every line the reader is meant to understand carries its plain-language subtitle', () => {
    // The brand trait P-14 names: the explanation under each number is what
    // makes these usable by someone who is not finance-literate.
    for (const line of lines) {
      assert.ok(
        (line.subtitle ?? '').length > 0,
        `«${line.label}» has no subtitle — the statement stops explaining itself`,
      );
    }
  });
});

describe('the balance and the flujo', () => {
  it('activo lists its three parts and closes on the total', () => {
    const lines = activoLines(BALANCE);
    assert.deepEqual(labels(lines), [
      'Efectivo',
      'Inventarios',
      'Cuentas por cobrar',
      'Total activo',
    ]);
    assert.equal(lines.at(-1)?.total, true);
    assert.equal(lines.at(-1)?.amount, peso(35));
  });

  it('pasivo closes on total capital', () => {
    const lines = pasivoLines(BALANCE);
    assert.deepEqual(labels(lines), ['Pasivo', 'Utilidad del periodo', 'Total capital']);
    assert.deepEqual(labels(lines.filter((l) => l.total)), ['Total capital']);
  });

  it('flujo subtotals operation and investment before the net movement', () => {
    const lines = flujoLines(FLUJO);
    assert.deepEqual(labels(lines.filter((l) => l.total)), [
      'Flujo de operación',
      'Flujo de inversión',
      'Incremento neto en efectivo',
    ]);
    // Buying stock is money out: it reads in parentheses and says so, because
    // a negative investment flow alarms people who have not seen one before.
    const compras = lines.find((l) => l.label === 'Compras de inventario');
    assert.equal(compras?.negative, true);
    assert.equal(compras?.subtitle, 'Es normal que sea negativo.');
  });
});
