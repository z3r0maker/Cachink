import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { VENTAS_FIXTURE } from '../../src/operador/ventas/fixture';
import { filtrar, resumen } from '../../src/operador/ventas/derive';

const ventas = VENTAS_FIXTURE.ventas;

describe('ventas del turno', () => {
  it('agrees with Inicio, Turno and Cierre: cancelled sales stay out of every total', () => {
    const r = resumen(ventas);
    assert.equal(r.activas, 12);
    assert.equal(r.cobrado, 3280_00n);
    assert.equal(r.efectivo, 2140_00n);
  });

  it('filters by method and searches folio, concept and client without accents', () => {
    assert.equal(filtrar(ventas, 'Fiado', '').length, 2);
    assert.deepEqual(
      filtrar(ventas, 'Todos', 'dona mari').map((v) => v.folio),
      ['V-0409'],
    );
    assert.deepEqual(
      filtrar(ventas, 'Todos', 'v-0405').map((v) => v.folio),
      ['V-0405'],
    );
    assert.equal(filtrar(ventas, 'Tarjeta', 'volcán').length, 0);
  });

  it('counts an empty turno as zero', () => {
    assert.deepEqual(resumen([]), { activas: 0, cobrado: 0n, efectivo: 0n });
  });
});
