/**
 * totalEgresosDelDia pure function tests.
 */

import { describe, expect, it } from 'vitest';
import { totalEgresosDelDia } from '../../src/hooks/use-total-egresos-del-dia';
import { makeExpense } from '@cachink/testing';

describe('totalEgresosDelDia', () => {
  it('returns 0n for empty array', () => {
    expect(totalEgresosDelDia([])).toBe(0n);
  });

  it('sums a single expense', () => {
    expect(totalEgresosDelDia([makeExpense({ monto: 1_200_000n })])).toBe(1_200_000n);
  });

  it('sums multiple expenses', () => {
    const expenses = [
      makeExpense({ monto: 500n }),
      makeExpense({ monto: 1500n }),
    ];
    expect(totalEgresosDelDia(expenses)).toBe(2000n);
  });
});
