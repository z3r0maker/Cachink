import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { folioBuscado } from '../src/queries/movimientos-filtro';

/** Which searches name a folio (DS-01), parsed without a backtracking regex (CodeQL #22). */
describe('folioBuscado', () => {
  it('reads a bare number, «#412», «folio 412» and their spacings as the folio', () => {
    for (const q of [
      '412',
      '#412',
      '# 412',
      'folio 412',
      'Folio #412',
      'FOLIO# 412',
      ' folio412 ',
    ]) {
      assert.equal(folioBuscado(q), 412, q);
    }
  });

  it('is not a folio when there is text, a sign, a decimal or nothing after the prefix', () => {
    for (const q of ['pan 412', '412 pan', '-4', '4.5', 'folio', '#', 'folios 4', '']) {
      assert.equal(folioBuscado(q), null, q);
    }
  });

  it('stops at nine digits, so a folio always fits an int4', () => {
    assert.equal(folioBuscado('999999999'), 999_999_999);
    assert.equal(folioBuscado('1234567890'), null);
  });

  it('answers at once on a long run of spaces (no polynomial backtracking)', () => {
    const started = performance.now();
    assert.equal(folioBuscado(`folio${' '.repeat(50_000)}x`), null);
    assert.equal(folioBuscado(`#${' '.repeat(50_000)}!`), null);
    assert.ok(performance.now() - started < 100);
  });
});
