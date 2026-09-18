import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { marginPercent, pesosToCentavos } from '../src/lib/money';

describe('pesosToCentavos', () => {
  it('turns what a shopkeeper types into integer centavos, with no float on the way', () => {
    assert.equal(pesosToCentavos('2100.50'), 210050n);
    assert.equal(pesosToCentavos('1,875.5'), 187550n);
    assert.equal(pesosToCentavos(' 12 '), 1200n);
    // 0.29 * 100 is 28.999999999999996 in floating point.
    assert.equal(pesosToCentavos('0.29'), 29n);
    assert.equal(pesosToCentavos('90071992547409.93'), 9007199254740993n);
  });

  it('refuses anything that is not a plain amount, instead of a silent zero', () => {
    for (const bad of ['', 'abc', '-5', '1.234', '1e3', '.5', '5.']) {
      assert.equal(pesosToCentavos(bad), null, `"${bad}"`);
    }
  });
});

describe('marginPercent', () => {
  it('is the margin on the sale price, never rounded up', () => {
    assert.equal(marginPercent('9.80', '25.00'), 60);
    assert.equal(marginPercent('2', '3'), 33);
    assert.equal(marginPercent('30', '25'), -20);
  });

  it('is null until both amounts parse, or when the price is zero', () => {
    assert.equal(marginPercent('', '25'), null);
    assert.equal(marginPercent('10', 'abc'), null);
    assert.equal(marginPercent('10', '0'), null);
  });
});
