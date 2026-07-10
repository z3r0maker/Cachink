/**
 * Product color mapping tests.
 */

import { describe, it, expect } from 'vitest';
import { PRODUCT_BG_COLORS, PRODUCT_COLOR_OPTIONS } from '../src/product-colors';

describe('PRODUCT_BG_COLORS', () => {
  it('has 8 color entries', () => {
    expect(Object.keys(PRODUCT_BG_COLORS)).toHaveLength(8);
  });

  it('includes all expected ProductColor keys', () => {
    const keys = Object.keys(PRODUCT_BG_COLORS);
    expect(keys).toContain('white');
    expect(keys).toContain('yellow');
    expect(keys).toContain('green');
    expect(keys).toContain('blue');
    expect(keys).toContain('pink');
    expect(keys).toContain('purple');
    expect(keys).toContain('peach');
    expect(keys).toContain('gray');
  });

  it('all values are non-empty hex strings', () => {
    for (const hex of Object.values(PRODUCT_BG_COLORS)) {
      expect(hex).toBeTruthy();
      expect(typeof hex).toBe('string');
    }
  });
});

describe('PRODUCT_COLOR_OPTIONS', () => {
  it('has 8 options', () => {
    expect(PRODUCT_COLOR_OPTIONS).toHaveLength(8);
  });

  it('each option has key, label, and hex', () => {
    for (const opt of PRODUCT_COLOR_OPTIONS) {
      expect(opt.key).toBeTruthy();
      expect(opt.label).toBeTruthy();
      expect(opt.hex).toBeTruthy();
    }
  });

  it('keys match PRODUCT_BG_COLORS keys', () => {
    const optionKeys = PRODUCT_COLOR_OPTIONS.map((o) => o.key);
    const bgKeys = Object.keys(PRODUCT_BG_COLORS);
    expect(optionKeys.sort()).toEqual(bgKeys.sort());
  });
});
