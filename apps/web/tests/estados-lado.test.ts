import assert from 'node:assert/strict';
import { calculateEstadoDeResultados, type Expense } from '@xangarro/domain';
import { describe, it } from 'vitest';

import { mayorGolpe, margenes, paraNoPerder } from '../src/app/(portal)/estados/lado-data';

const gasto = (categoria: Expense['categoria'], monto: bigint): Expense =>
  ({ id: '01J-E', fecha: '2026-05-01', concepto: 'x', categoria, monto }) as unknown as Expense;

/** The canvas's September: $8,835 sold, $3,760 of it cost, $11,970 of gastos, $29 of merma. */
const SEPTIEMBRE = calculateEstadoDeResultados({
  ventas: [{ monto: 883_500n }] as never,
  egresos: [gasto('Materia Prima', 376_000n), gasto('Renta', 1_197_000n)],
  mermaMovements: [{ cantidad: 1, costoUnitCentavos: 2_900n }] as never,
  isrTasa: 0,
});

describe('«Para no perder» — the month’s break-even (ADR-107)', () => {
  it('is gastos + merma over the gross margin, rounded up to the next $100', () => {
    const p = paraNoPerder(SEPTIEMBRE);
    // (11,970 + 29) / (5,075 / 8,835) = 20,888.4… → $20,900.
    assert.equal(p?.meta, 2_090_000n);
    assert.equal(p?.llevas, 883_500n);
    assert.equal(p?.faltan, 1_206_500n);
    assert.equal(p?.avance, 42);
  });

  it('says nothing when there is no margin to cover anything with', () => {
    const sinVentas = calculateEstadoDeResultados({
      ventas: [],
      egresos: [gasto('Renta', 100n)],
      isrTasa: 0,
    });
    assert.equal(paraNoPerder(sinVentas), null);
    const alCosto = calculateEstadoDeResultados({
      ventas: [{ monto: 100n }] as never,
      egresos: [gasto('Materia Prima', 100n), gasto('Renta', 50n)],
      isrTasa: 0,
    });
    assert.equal(paraNoPerder(alCosto), null);
  });

  it('caps the bar at 100% once the month is covered', () => {
    const holgado = calculateEstadoDeResultados({
      ventas: [{ monto: 1_000_000n }] as never,
      egresos: [gasto('Materia Prima', 400_000n), gasto('Renta', 100_000n)],
      isrTasa: 0,
    });
    const p = paraNoPerder(holgado);
    assert.equal(p?.avance, 100);
    assert.equal(p?.faltan, 0n);
  });
});

describe('the margin tiles', () => {
  it('are whole percents of what was sold, signed', () => {
    assert.deepEqual(margenes(SEPTIEMBRE), { bruto: 57, operacion: -78 });
  });

  it('are null with nothing sold', () => {
    const vacio = calculateEstadoDeResultados({ ventas: [], egresos: [], isrTasa: 0 });
    assert.deepEqual(margenes(vacio), { bruto: null, operacion: null });
  });
});

describe('Don’s line: the biggest thing that took money', () => {
  it('names the largest drop, in the owner’s words', () => {
    assert.deepEqual(mayorGolpe(SEPTIEMBRE), { label: 'Gastos de operación', monto: 1_197_000n });
  });
});
