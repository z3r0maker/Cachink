import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { pesosToCentavos } from '../../src/index.js';

/**
 * Pesos in, centavos out (§2.8): parsed as digits, never as a float, and
 * anything that is not a plain non-negative amount with at most two decimals
 * is refused rather than coerced — a silent zero is worse than a refusal.
 */
describe('pesosToCentavos', () => {
  it('reads what the shopkeeper types into integer centavos', () => {
    assert.equal(pesosToCentavos('2100.50'), 210050n);
    assert.equal(pesosToCentavos('0.29'), 29n);
    assert.equal(pesosToCentavos('12'), 1200n);
    assert.equal(pesosToCentavos('0.5'), 50n);
  });

  it('tolerates the commas and spaces a hand-typed amount carries', () => {
    assert.equal(pesosToCentavos('1,000'), 100000n);
    assert.equal(pesosToCentavos('  42.10 '), 4210n);
  });

  it('refuses what is not a plain amount — silently, not as zero', () => {
    assert.equal(pesosToCentavos(''), null);
    assert.equal(pesosToCentavos('-100'), null);
    assert.equal(pesosToCentavos('1.999'), null);
    assert.equal(pesosToCentavos('.5'), null);
    assert.equal(pesosToCentavos('10.'), null);
    assert.equal(pesosToCentavos('abc'), null);
    assert.equal(pesosToCentavos('1.2.3'), null);
  });
});
