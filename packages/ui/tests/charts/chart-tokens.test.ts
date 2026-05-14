/**
 * chart-tokens — unit tests for shared chart helpers.
 */

import { describe, expect, it } from 'vitest';
import { clampPercent, moneyToNumber, formatChartLabel } from '../../src/charts/chart-tokens';

describe('clampPercent', () => {
  it('returns 0 when max is 0', () => {
    expect(clampPercent(50, 0)).toBe(0);
  });

  it('returns 0 when value is 0', () => {
    expect(clampPercent(0, 100)).toBe(0);
  });

  it('returns correct percentage for normal values', () => {
    expect(clampPercent(50, 200)).toBe(25);
  });

  it('clamps to 100 when value exceeds max', () => {
    expect(clampPercent(300, 100)).toBe(100);
  });

  it('clamps to 0 for negative values', () => {
    expect(clampPercent(-10, 100)).toBe(0);
  });

  it('returns 0 for negative max', () => {
    expect(clampPercent(50, -10)).toBe(0);
  });
});

describe('moneyToNumber', () => {
  it('converts bigint centavos to peso number', () => {
    expect(moneyToNumber(1234n)).toBe(12.34);
  });

  it('handles zero', () => {
    expect(moneyToNumber(0n)).toBe(0);
  });

  it('handles negative centavos', () => {
    expect(moneyToNumber(-500n)).toBe(-5);
  });

  it('handles large values', () => {
    expect(moneyToNumber(1_000_000_00n)).toBe(1_000_000);
  });
});

describe('formatChartLabel', () => {
  it('formats millions with M suffix', () => {
    expect(formatChartLabel(1_200_000)).toBe('$1.2M');
  });

  it('formats thousands with K suffix', () => {
    expect(formatChartLabel(12_500)).toBe('$12.5K');
  });

  it('formats small values without suffix', () => {
    expect(formatChartLabel(850)).toBe('$850');
  });

  it('handles negative values', () => {
    expect(formatChartLabel(-5_000)).toBe('-$5K');
  });

  it('drops trailing .0 for even millions', () => {
    expect(formatChartLabel(2_000_000)).toBe('$2M');
  });

  it('drops trailing .0 for even thousands', () => {
    expect(formatChartLabel(3_000)).toBe('$3K');
  });

  it('handles zero', () => {
    expect(formatChartLabel(0)).toBe('$0');
  });

  it('preserves one decimal for fractional values under 1000', () => {
    expect(formatChartLabel(1.5)).toBe('$1.5');
  });

  it('preserves two decimals when significant', () => {
    expect(formatChartLabel(3.75)).toBe('$3.75');
  });

  it('still shows integer for whole numbers under 1000', () => {
    expect(formatChartLabel(5)).toBe('$5');
  });

  it('formats negative fractional values', () => {
    expect(formatChartLabel(-2.5)).toBe('-$2.5');
  });
});
