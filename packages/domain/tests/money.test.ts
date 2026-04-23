import { describe, it, expect } from 'vitest';
import {
  fromCentavos,
  fromPesos,
  sum,
  subtract,
  multiplyByInteger,
  isNonNegative,
  toPesosString,
  ZERO,
} from '../src/money/index.js';

describe('Money.fromCentavos', () => {
  it('accepts a bigint and returns it unchanged', () => {
    expect(fromCentavos(123n)).toBe(123n);
  });

  it('accepts an integer number and converts it to bigint', () => {
    expect(fromCentavos(123)).toBe(123n);
  });

  it('rejects a non-integer number to prevent silent rounding', () => {
    expect(() => fromCentavos(1.5)).toThrow(TypeError);
  });

  it('accepts zero', () => {
    expect(fromCentavos(0)).toBe(0n);
  });

  it('accepts a negative integer for refund scenarios', () => {
    expect(fromCentavos(-100)).toBe(-100n);
  });
});

describe('Money.fromPesos', () => {
  it('parses integer pesos', () => {
    expect(fromPesos('10')).toBe(1000n);
    expect(fromPesos(10)).toBe(1000n);
  });

  it('parses pesos with two decimal places', () => {
    expect(fromPesos('12.34')).toBe(1234n);
  });

  it('parses pesos with one decimal place', () => {
    expect(fromPesos('12.3')).toBe(1230n);
  });

  it('parses zero', () => {
    expect(fromPesos('0')).toBe(0n);
    expect(fromPesos('0.00')).toBe(0n);
  });

  it('parses negative amounts', () => {
    expect(fromPesos('-5.50')).toBe(-550n);
  });

  it('rejects more than 2 decimal places', () => {
    expect(() => fromPesos('12.345')).toThrow(TypeError);
  });

  it('rejects non-numeric input', () => {
    expect(() => fromPesos('abc')).toThrow(TypeError);
    expect(() => fromPesos('12.')).toThrow(TypeError);
    expect(() => fromPesos('.5')).toThrow(TypeError);
  });
});

describe('Money.sum', () => {
  it('sums an empty list to ZERO', () => {
    expect(sum([])).toBe(ZERO);
  });

  it('sums a non-empty list', () => {
    expect(sum([100n, 200n, 300n])).toBe(600n);
  });

  it('handles mixed positive and negative amounts', () => {
    expect(sum([1000n, -300n, 500n])).toBe(1200n);
  });

  it('sums very large amounts without precision loss (bigint guarantee)', () => {
    const oneTrillionCentavos = 10n ** 12n;
    expect(sum([oneTrillionCentavos, oneTrillionCentavos])).toBe(2n * oneTrillionCentavos);
  });
});

describe('Money.subtract', () => {
  it('subtracts b from a', () => {
    expect(subtract(1000n, 250n)).toBe(750n);
  });

  it('can produce a negative result', () => {
    expect(subtract(100n, 200n)).toBe(-100n);
  });
});

describe('Money.multiplyByInteger', () => {
  it('multiplies by a positive integer', () => {
    expect(multiplyByInteger(100n, 3)).toBe(300n);
  });

  it('multiplies by a bigint factor', () => {
    expect(multiplyByInteger(100n, 3n)).toBe(300n);
  });

  it('multiplies by zero', () => {
    expect(multiplyByInteger(100n, 0)).toBe(0n);
  });

  it('rejects non-integer multipliers to prevent silent rounding', () => {
    expect(() => multiplyByInteger(100n, 1.5)).toThrow(TypeError);
  });
});

describe('Money.isNonNegative', () => {
  it('returns true for zero', () => {
    expect(isNonNegative(0n)).toBe(true);
  });

  it('returns true for positive values', () => {
    expect(isNonNegative(1n)).toBe(true);
  });

  it('returns false for negative values', () => {
    expect(isNonNegative(-1n)).toBe(false);
  });
});

describe('Money.toPesosString', () => {
  it('formats whole pesos', () => {
    expect(toPesosString(1000n)).toBe('10.00');
  });

  it('formats pesos with centavos', () => {
    expect(toPesosString(1234n)).toBe('12.34');
  });

  it('pads centavos to two digits', () => {
    expect(toPesosString(1005n)).toBe('10.05');
  });

  it('formats zero', () => {
    expect(toPesosString(0n)).toBe('0.00');
  });

  it('formats negative amounts with a leading minus', () => {
    expect(toPesosString(-1234n)).toBe('-12.34');
  });

  it('formats single centavos', () => {
    expect(toPesosString(1n)).toBe('0.01');
  });
});
