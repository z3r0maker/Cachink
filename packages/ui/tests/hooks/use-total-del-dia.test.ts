/**
 * totalDelDia pure function tests.
 */

import { describe, expect, it } from 'vitest';
import { totalDelDia } from '../../src/hooks/use-total-del-dia';
import { makeSale } from '@cachink/testing';

describe('totalDelDia', () => {
  it('returns 0n for empty array', () => {
    expect(totalDelDia([])).toBe(0n);
  });

  it('sums a single sale', () => {
    expect(totalDelDia([makeSale({ monto: 5000n })])).toBe(5000n);
  });

  it('sums multiple sales', () => {
    const sales = [
      makeSale({ monto: 1000n }),
      makeSale({ monto: 2000n }),
      makeSale({ monto: 3000n }),
    ];
    expect(totalDelDia(sales)).toBe(6000n);
  });
});
