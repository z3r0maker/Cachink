import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { TOTAL_MS, escenaEn } from '../src/app/login/animation-clock';

/** The design file's scene boundaries: 6 s / 3.5 s / 5 s / 5.5 s over 20 s. */
describe('escenaEn', () => {
  it('walks the four scenes at their boundaries', () => {
    assert.equal(escenaEn(0).i, 0);
    assert.equal(escenaEn(5999).i, 0);
    assert.equal(escenaEn(6000).i, 1);
    assert.equal(escenaEn(9500).i, 2);
    assert.equal(escenaEn(14500).i, 3);
    assert.equal(escenaEn(19999).i, 3);
  });

  it('wraps the 20 s loop', () => {
    assert.equal(escenaEn(20000).i, 0);
    assert.equal(escenaEn(26000).i, 1);
  });

  it('progress goes 0→1 inside a scene', () => {
    assert.equal(escenaEn(6000).p, 0);
    assert.ok(escenaEn(7750).p > 0.49 && escenaEn(7750).p < 0.51);
    assert.ok(escenaEn(9499).p <= 1);
  });

  it('negative and oversized inputs stay in range', () => {
    assert.ok(escenaEn(-500).i >= 0 && escenaEn(-500).i <= 3);
    assert.ok(escenaEn(999_999).i >= 0 && escenaEn(999_999).i <= 3);
  });

  it('the loop is exactly 20 seconds', () => {
    assert.equal(TOTAL_MS, 20_000);
  });
});
