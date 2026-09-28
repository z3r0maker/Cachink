import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { calcularCapacidades } from '../../src/asesor/capacidades.js';

/** The Fase 6 compuerta: a locked capability states its progress, never a conclusion. */
const filas = (over: Partial<Parameters<typeof calcularCapacidades>[0]> = {}) =>
  calcularCapacidades({
    hoy: '2026-05-12',
    diasConVenta: 33,
    diasConMovimiento: 21,
    diasDeHistorial: 40,
    compras: 1,
    cortes: 8,
    mesesConGasto: 2,
    ...over,
  });

const copia = (over: Parameters<typeof filas>[0], name: string) =>
  filas(over).find((c) => c.name === name)?.lockedCopy;

/**
 * `lockedCopy` — the actionable line beside the count (ADR-116).
 *
 * An «Disponible en N días» is a promise, so it is given only where the counter
 * advances with the calendar on its own. `diasDeHistorial` does: it is days
 * since the first record and grows whether or not anything else is captured.
 * Every other counter waits on the shopkeeper, and the design's own
 * «Disponible en 31 días» for Gastos is a promise a quiet month breaks.
 */
describe('Capacidad.lockedCopy', () => {
  it('promises a date only where the calendar alone gets there', () => {
    // 90 − 67 = 23, which is the design's own fixture for this row.
    assert.equal(
      copia({ diasDeHistorial: 67 }, '¿Me alcanza? (pronóstico)'),
      'Disponible en 23 días',
    );
    assert.equal(copia({ diasDeHistorial: 12 }, 'Resumen del mes'), 'Disponible en 18 días');
  });

  it('says día, not días, on the last one', () => {
    assert.equal(copia({ diasDeHistorial: 29 }, 'Resumen del mes'), 'Disponible en 1 día');
  });

  it('tells the shopkeeper what to do when the blocker is a purchase, not a date', () => {
    assert.equal(
      copia({ compras: 0 }, 'Precios y márgenes'),
      'Registra el costo de tus productos para activarlo',
    );
  });

  it('stops giving purchase advice once the purchases are there', () => {
    // Two compras logged, still short on días: repeating «registra el costo»
    // would be advice the shopkeeper has already taken.
    assert.equal(
      copia({ compras: 2, diasConVenta: 33 }, 'Precios y márgenes'),
      'Llevas 33 de 60 días de ventas',
    );
  });

  it('never promises a date for a counter that waits on the shopkeeper', () => {
    // The design says «Disponible en 31 días» here. A month only counts once
    // an egreso lands in it, so the calendar alone does not get there.
    assert.equal(copia({ mesesConGasto: 2 }, 'Gastos fuera de lo normal'), 'Llevas 2 de 3 meses');
    assert.equal(copia({ cortes: 8 }, 'Corte de caja'), 'Llevas 8 de 20 cortes');
    assert.equal(
      copia({ diasConMovimiento: 21 }, 'Inventario'),
      'Llevas 21 de 60 días de movimientos',
    );
  });

  it('is empty once the capability is active, so nothing stale can render', () => {
    const activas = filas({
      diasDeHistorial: 300,
      diasConVenta: 200,
      diasConMovimiento: 180,
      compras: 30,
      cortes: 99,
      mesesConGasto: 12,
    });
    assert.ok(activas.every((c) => !c.locked));
    assert.deepEqual([...new Set(activas.map((c) => c.lockedCopy))], ['']);
  });
});

describe('calcularCapacidades', () => {
  it('reports progress for a young business and active for a full one', () => {
    const joven = calcularCapacidades({
      hoy: '2026-05-12',
      diasConVenta: 33,
      diasConMovimiento: 21,
      diasDeHistorial: 40,
      compras: 1,
      cortes: 8,
      mesesConGasto: 2,
    });
    const resumen = joven.find((c) => c.name === 'Resumen del mes');
    assert.equal(resumen?.locked, false);
    assert.equal(resumen?.progress, 'Activo');
    const corte = joven.find((c) => c.name === 'Corte de caja');
    assert.equal(corte?.locked, true);
    assert.equal(corte?.progress, '8 de 20 cortes');
    const margenes = joven.find((c) => c.name === 'Precios y márgenes');
    assert.equal(margenes?.locked, true);
    assert.match(margenes?.progress ?? '', /33 de 60 días · 1 de 2 compras/);
    // Inventario reads movimientos now, not ventas (ADR-115): 21, not 33.
    const inventario = joven.find((c) => c.name === 'Inventario');
    assert.equal(inventario?.progress, '21 de 60 días de movimientos');
    // «90 días de registros» is history, so 40 — not the 33 days carrying a venta.
    const pronostico = joven.find((c) => c.name === '¿Me alcanza? (pronóstico)');
    assert.equal(pronostico?.progress, '40 de 90 días de registros');
    const gastos = joven.find((c) => c.name === 'Gastos fuera de lo normal');
    assert.equal(gastos?.progress, '2 de 3 meses');
  });

  it('capacidades never exceed their objective in the progress line', () => {
    const maduro = calcularCapacidades({
      hoy: '2026-05-12',
      diasConVenta: 200,
      diasConMovimiento: 180,
      diasDeHistorial: 300,
      compras: 30,
      cortes: 99,
      mesesConGasto: 12,
    });
    assert.ok(maduro.every((c) => !c.locked));
    assert.ok(maduro.every((c) => c.progress === 'Activo'));
  });
});
