/**
 * Money is represented as a bigint number of centavos (1/100 of a peso).
 *
 * Never use `Number` for money — floating-point rounding corrupts totals.
 * All arithmetic is done on bigints; conversion to/from user-facing strings
 * is a presentation concern handled outside this module.
 *
 * See ADR-009 (ARCHITECTURE.md) and CLAUDE.md §2 principle 8.
 */

/** Opaque bigint representing an integer number of centavos. */
export type Money = bigint;

/** Create a Money value from an integer number of centavos. */
export function fromCentavos(centavos: bigint | number): Money {
  if (typeof centavos === 'number') {
    if (!Number.isInteger(centavos)) {
      throw new TypeError(`Money must be an integer number of centavos, got ${centavos}`);
    }
    return BigInt(centavos);
  }
  return centavos;
}

/**
 * Create a Money value from a peso amount expressed as a string (e.g. "12.34")
 * or integer pesos. Rejects inputs with more than 2 decimal places to avoid
 * silent rounding.
 */
export function fromPesos(pesos: string | number): Money {
  const str = typeof pesos === 'number' ? pesos.toString() : pesos.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
    throw new TypeError(
      `Invalid peso amount: "${pesos}". Expected a number with at most 2 decimal places.`,
    );
  }
  const [integerPart = '0', decimalPart = ''] = str.split('.');
  const centavosStr = `${integerPart}${decimalPart.padEnd(2, '0')}`;
  return BigInt(centavosStr);
}

/** Zero pesos. */
export const ZERO: Money = 0n;

/** Sum an arbitrary list of Money values. */
export function sum(values: readonly Money[]): Money {
  let total: Money = ZERO;
  for (const v of values) total += v;
  return total;
}

/** Subtract b from a. */
export function subtract(a: Money, b: Money): Money {
  return a - b;
}

/** Multiply Money by an integer. Throws on non-integer multipliers to prevent silent rounding. */
export function multiplyByInteger(value: Money, factor: number | bigint): Money {
  if (typeof factor === 'number') {
    if (!Number.isInteger(factor)) {
      throw new TypeError(
        `multiplyByInteger requires an integer factor; use a decimal library for fractional multiplication.`,
      );
    }
    return value * BigInt(factor);
  }
  return value * factor;
}

/** Check whether a value is non-negative. */
export function isNonNegative(value: Money): boolean {
  return value >= ZERO;
}

/** Format Money as a bare peso string, e.g. 123456n → "1234.56". No currency symbol. */
export function toPesosString(value: Money): string {
  const negative = value < ZERO;
  const abs = negative ? -value : value;
  const centavos = abs % 100n;
  const pesos = abs / 100n;
  const sign = negative ? '-' : '';
  return `${sign}${pesos.toString()}.${centavos.toString().padStart(2, '0')}`;
}
