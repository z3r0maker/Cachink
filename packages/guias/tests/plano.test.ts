import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { palabras, plano } from '../src/index.js';

describe('plano: one way to fold text for every search (ADR-163)', () => {
  it('drops accents and case', () => {
    assert.equal(plano('Revisión de CAJA'), 'revision de caja');
  });

  it('leaves text with nothing to fold as it is', () => {
    assert.equal(plano('corte 2'), 'corte 2');
  });

  it('gives nothing for nothing', () => {
    assert.equal(plano(''), '');
  });

  it('folds the ñ too, as the palette and the help search always did', () => {
    assert.equal(plano('Año'), 'ano');
  });

  it('splits a search into its words, however many spaces surround them', () => {
    assert.deepEqual(palabras('  Cobrar   VENTA '), ['cobrar', 'venta']);
  });

  it('finds no words in a search of only spaces', () => {
    assert.deepEqual(palabras('   '), []);
  });
});
