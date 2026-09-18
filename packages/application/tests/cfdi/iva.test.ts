/**
 * IVA arithmetic for CFDI — integer centavos, explicit rounding.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { ivaOnBase, splitIvaIncluded } from '../../src/cfdi/index.js';

describe('splitIvaIncluded', () => {
  it('splits the $199 plan price', () => {
    assert.deepEqual(splitIvaIncluded(19_900n), { subtotal: 17_155n, iva: 2_745n });
  });

  it('splits the $399 plan price (a total no 2-decimal base reaches exactly)', () => {
    // 399 / 1.16 = 343.9655… → 343.97; IVA = 399.00 − 343.97 = 55.03
    assert.deepEqual(splitIvaIncluded(39_900n), { subtotal: 34_397n, iva: 5_503n });
  });

  it("matches Facturapi's documented example (345.60 → base 297.93)", () => {
    assert.equal(splitIvaIncluded(34_560n).subtotal, 29_793n);
  });

  it('always reconciles to the charged total and stays within one centavo of 16%', () => {
    for (let total = 1n; total <= 20_000n; total += 1n) {
      const { subtotal, iva } = splitIvaIncluded(total);
      assert.equal(subtotal + iva, total);
      const drift = iva * 100n - subtotal * 16n; // in hundredths of a centavo
      assert.ok(drift <= 100n && drift >= -100n, `total ${total}`);
    }
  });

  it('rejects zero, negative, and non-bigint totals', () => {
    assert.throws(() => splitIvaIncluded(0n), { code: 'CFDI_INVALID_AMOUNT' });
    assert.throws(() => splitIvaIncluded(-5n), { code: 'CFDI_INVALID_AMOUNT' });
    assert.throws(() => splitIvaIncluded(19.9 as unknown as bigint), {
      code: 'CFDI_INVALID_AMOUNT',
    });
  });
});

describe('ivaOnBase', () => {
  it('rounds half up', () => {
    assert.equal(ivaOnBase(17_155n), 2_745n); // 2744.8
    assert.equal(ivaOnBase(34_396n), 5_503n); // 5503.36
    assert.equal(ivaOnBase(25n), 4n); // exactly 4.0
    assert.equal(ivaOnBase(3_125n), 500n); // exactly 500
    assert.equal(ivaOnBase(28_125n), 4_500n);
    assert.equal(ivaOnBase(0n), 0n);
  });

  it('rounds to the nearest centavo (16% never lands exactly on .5)', () => {
    assert.equal(ivaOnBase(1_003n), 160n); // 160.48
    assert.equal(ivaOnBase(1_028n), 164n); // 164.48
    assert.equal(ivaOnBase(1_025n), 164n); // 164.00
    assert.equal(ivaOnBase(1_031n), 165n); // 164.96
  });

  it('rejects a negative base', () => {
    assert.throws(() => ivaOnBase(-1n), { code: 'CFDI_INVALID_AMOUNT' });
  });
});
