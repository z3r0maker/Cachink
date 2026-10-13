/**
 * The Inventario phone derivations (Track M, M-09): the confirmation toast
 * the sheet leaves behind, and the raw quantity text as the whole number the
 * domain accepts — the sheet's validation rules, pure.
 */
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { cantidadValida, toastDe } from '../src/inventario/derive';
import type { NuevoMovimientoVivo } from '../src/inventario/types';

const entrada: NuevoMovimientoVivo = {
  tipo: 'Entrada',
  existenciaId: 'pastor',
  cantidad: 15,
  detalle: 'Carnicería La Central',
};

const merma: NuevoMovimientoVivo = {
  tipo: 'Merma',
  existenciaId: 'horchata',
  cantidad: 2,
  detalle: 'Se cortó con el calor',
};

describe('toastDe', () => {
  it('says an entrada without its supplier, a merma with what happened', () => {
    assert.equal(
      toastDe(entrada, 'Carne de pastor').body,
      '+15 de Carne de pastor. Queda en tu turno.',
    );
    assert.equal(
      toastDe(merma, 'Horchata preparada').body,
      '−2 de Horchata preparada · Se cortó con el calor. Queda en tu turno.',
    );
  });

  it('carries the kind so the toast can tint its head', () => {
    assert.equal(toastDe(entrada, 'X').tipo, 'Entrada');
    assert.equal(toastDe(merma, 'X').tipo, 'Merma');
  });

  it('says the merma with an empty reason as the panel could hand it', () => {
    assert.equal(
      toastDe({ ...merma, detalle: '' }, 'Queso oaxaca').body,
      '−2 de Queso oaxaca. Queda en tu turno.',
    );
  });
});

describe('cantidadValida', () => {
  it('accepts a whole number above zero, however it is typed', () => {
    assert.equal(cantidadValida('15'), 15);
    assert.equal(cantidadValida('1'), 1);
    assert.equal(cantidadValida('007'), 7);
  });

  it('refuses an empty field, junk and zero', () => {
    assert.equal(cantidadValida(''), null);
    assert.equal(cantidadValida('   '), null);
    assert.equal(cantidadValida('abc'), null);
    assert.equal(cantidadValida('0'), null);
  });

  it('refuses a decimal: the ledger counts integers', () => {
    assert.equal(cantidadValida('1.5'), null);
    assert.equal(cantidadValida('0.5'), null);
    assert.equal(cantidadValida('15,5'), null);
  });
});
