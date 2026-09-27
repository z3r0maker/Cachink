import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { calcularCapacidades } from '../../src/asesor/capacidades.js';

/** The Fase 6 compuerta: a locked capability states its progress, never a conclusion. */
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
