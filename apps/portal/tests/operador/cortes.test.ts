import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { CORTES_FIXTURE } from '../../src/app/(portal)/cortes/fixture';
import {
  conSigno,
  contado,
  diferencia,
  esperado,
  filtrar,
  netoTexto,
  resumen,
} from '../../src/app/(portal)/cortes/derive';

const estado = (c: (typeof CORTES_FIXTURE)[number]) => c.estado;
const luis = CORTES_FIXTURE[1]!;

describe('cortes de turno', () => {
  it('derives expected cash with the domain and counted cash from the stored count', () => {
    assert.equal(esperado(CORTES_FIXTURE[0]!), 2_870_00n);
    assert.deepEqual(
      CORTES_FIXTURE.map((c) => contado(c)),
      [2_870_00n, 2_180_00n, 3_370_00n, 1_935_00n, 2_150_00n, 2_960_00n],
    );
    assert.equal(conSigno(diferencia(luis)), '−$60.00');
    assert.equal(conSigno(diferencia(CORTES_FIXTURE[3]!)), '+$40.00');
  });

  it('sums the month: −$80.00 net, three balanced, two to clarify', () => {
    const r = resumen(CORTES_FIXTURE, estado);
    assert.equal(netoTexto(r.neto), '−$80.00');
    assert.equal(r.cuadraron, 3);
    assert.equal(r.porAclarar, 2);
    assert.equal(r.equipo, 'Dos cajas, tres personas');
  });

  it('filters by state, difference and register, and searches without accents', () => {
    assert.equal(filtrar(CORTES_FIXTURE, 'Por aclarar', estado, '').length, 2);
    assert.equal(filtrar(CORTES_FIXTURE, 'Con diferencia', estado, '').length, 3);
    assert.equal(filtrar(CORTES_FIXTURE, 'Caja 2', estado, '').length, 3);
    assert.deepEqual(
      filtrar(CORTES_FIXTURE, 'Todos', estado, 'sofia').map((c) => c.id),
      ['c-0512-sofia'],
    );
  });
});
