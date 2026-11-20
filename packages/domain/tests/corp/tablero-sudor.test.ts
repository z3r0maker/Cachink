import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { costoDeSudor } from '../../src/corp/tablero/index.js';
import { ev, tarjeta } from './tablero-fixture.js';

/**
 * E-12's «Costo de sudor» memo (owner decision 2026-11-20): the Tablero's
 * accepted value counts in the month its card was finished, once accepted.
 */
const aceptada = (id: string, terminada: string, aceptadaEl: string, over = {}) =>
  tarjeta({
    id,
    eventos: [ev('terminada', terminada, 1), ev('aceptada', aceptadaEl, 2)],
    ...over,
  });

describe('costoDeSudor', () => {
  it('sums the accepted value of the cards finished in the period', () => {
    const r = costoDeSudor(
      [aceptada('a', '2026-11-12', '2026-11-14'), aceptada('b', '2026-11-30', '2026-12-02')],
      { desde: '2026-11-01', hasta: '2026-11-30' },
      '2026-12-05',
    );
    assert.deepEqual(r, { valor: 70_000_00n, tarjetas: 2 });
  });

  it('counts a card in the month it was finished, though accepted in the next', () => {
    const t = [aceptada('a', '2026-12-29', '2027-01-04')];
    assert.equal(
      costoDeSudor(t, { desde: '2026-12-01', hasta: '2026-12-31' }, '2027-01-05').valor,
      35_000_00n,
    );
    assert.equal(
      costoDeSudor(t, { desde: '2027-01-01', hasta: '2027-01-31' }, '2027-01-05').valor,
      0n,
    );
  });

  it('leaves out what is still in review, objected, or a task', () => {
    const r = costoDeSudor(
      [
        tarjeta({ id: 'r', eventos: [ev('terminada', '2026-11-25', 1)] }),
        tarjeta({
          id: 'o',
          eventos: [ev('terminada', '2026-11-05', 1), ev('objetada', '2026-11-06', 2)],
        }),
        tarjeta({
          id: 't',
          tipo: 'tarea',
          valores: { 1: null, 2: null },
          eventos: [ev('hecha', '2026-11-03', 1)],
        }),
      ],
      { desde: '2026-11-01', hasta: '2026-11-30' },
      '2026-11-28',
    );
    assert.deepEqual(r, { valor: 0n, tarjetas: 0 });
  });

  it('a card the silence accepted counts once its ten days are over', () => {
    const t = [tarjeta({ eventos: [ev('terminada', '2026-11-12', 1)] })];
    const periodo = { desde: '2026-11-01', hasta: '2026-11-30' };
    assert.equal(costoDeSudor(t, periodo, '2026-11-22').valor, 0n);
    assert.equal(costoDeSudor(t, periodo, '2026-11-23').valor, 35_000_00n);
  });
});
