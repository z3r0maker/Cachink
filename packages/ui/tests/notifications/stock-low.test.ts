/**
 * stockLowCount (A-13): the 19:00 reminder's predicate.
 */

import { describe, expect, it } from 'vitest';
import { stockLowCount } from '../../src/notifications/stock-low';

const ROWS = [
  { producto: { seguirStock: true, umbralStockBajo: 3 }, stock: 2 },
  { producto: { seguirStock: true, umbralStockBajo: 3 }, stock: 3 },
  { producto: { seguirStock: true, umbralStockBajo: 3 }, stock: 9 },
  { producto: { seguirStock: false, umbralStockBajo: 3 }, stock: 0 },
];
const ON = { notificationsEnabled: true, stockEnabled: true };

describe('stockLowCount', () => {
  it('counts tracked products at or below their threshold', () => {
    expect(stockLowCount(ROWS, ON)).toBe(2);
  });

  it('is zero with the device notifications toggle off', () => {
    expect(stockLowCount(ROWS, { ...ON, notificationsEnabled: false })).toBe(0);
  });

  it('is zero when the plan has no stock', () => {
    expect(stockLowCount(ROWS, { ...ON, stockEnabled: false })).toBe(0);
  });

  it('ignores products that do not track stock', () => {
    expect(stockLowCount([ROWS[3]!], ON)).toBe(0);
  });
});
