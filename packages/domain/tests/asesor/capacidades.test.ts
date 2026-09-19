import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { calcularCapacidades, mesesConGastoDe } from '../../src/asesor/capacidades.js';

/** The Fase 6 compuerta: a locked capability states its progress, never a conclusion. */
describe('calcularCapacidades', () => {
  it('reports progress for a young business and active for a full one', () => {
    const joven = calcularCapacidades({
      hoy: '2026-05-12',
      diasConVenta: 33,
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
  });

  it('capacidades never exceed their objective in the progress line', () => {
    const maduro = calcularCapacidades({
      hoy: '2026-05-12',
      diasConVenta: 200,
      diasDeHistorial: 300,
      compras: 30,
      cortes: 99,
      mesesConGasto: 12,
    });
    assert.ok(maduro.every((c) => !c.locked));
    assert.ok(maduro.every((c) => c.progress === 'Activo'));
  });
});

describe('mesesConGastoDe', () => {
  it('counts distinct months, not rows', () => {
    assert.equal(mesesConGastoDe(['2026-02-01', '2026-02-15', '2026-03-01']), 2);
  });
});
