/**
 * previousNMonths + composeIndicadoresTrend tests.
 */

import { describe, expect, it } from 'vitest';
import type { IsoDate, PeriodRange } from '@cachink/domain';
import { previousNMonths } from '../../src/hooks/use-indicadores-trend';

describe('previousNMonths', () => {
  it('generates correct 6 monthly ranges', () => {
    const base: PeriodRange = { from: '2026-04-01' as IsoDate, to: '2026-04-30' as IsoDate };
    const result = previousNMonths(base, 6);
    expect(result.length).toBe(6);
    expect(result[0]!.from).toBe('2025-11-01');
    expect(result[0]!.to).toBe('2025-11-30');
    expect(result[5]!.from).toBe('2026-04-01');
    expect(result[5]!.to).toBe('2026-04-30');
  });

  it('wraps across year boundaries', () => {
    const base: PeriodRange = { from: '2026-03-01' as IsoDate, to: '2026-03-31' as IsoDate };
    const result = previousNMonths(base, 6);
    expect(result[0]!.from).toBe('2025-10-01');
    expect(result[0]!.to).toBe('2025-10-31');
    expect(result[2]!.from).toBe('2025-12-01');
    expect(result[2]!.to).toBe('2025-12-31');
    expect(result[3]!.from).toBe('2026-01-01');
    expect(result[3]!.to).toBe('2026-01-31');
  });

  it('handles February correctly (non-leap year)', () => {
    const base: PeriodRange = { from: '2025-02-01' as IsoDate, to: '2025-02-28' as IsoDate };
    const result = previousNMonths(base, 1);
    expect(result[0]!.to).toBe('2025-02-28');
  });

  it('handles February in a leap year', () => {
    const base: PeriodRange = { from: '2024-02-01' as IsoDate, to: '2024-02-29' as IsoDate };
    const result = previousNMonths(base, 1);
    expect(result[0]!.to).toBe('2024-02-29');
  });

  it('single-month generates one range', () => {
    const base: PeriodRange = { from: '2026-06-01' as IsoDate, to: '2026-06-30' as IsoDate };
    const result = previousNMonths(base, 1);
    expect(result.length).toBe(1);
    expect(result[0]!.from).toBe('2026-06-01');
  });

  it('annual periodo still generates 6 monthly lookbacks from end date', () => {
    const base: PeriodRange = { from: '2026-01-01' as IsoDate, to: '2026-12-31' as IsoDate };
    const result = previousNMonths(base, 6);
    expect(result.length).toBe(6);
    // Last range should be December
    expect(result[5]!.from).toBe('2026-12-01');
    expect(result[5]!.to).toBe('2026-12-31');
    // First range should be July
    expect(result[0]!.from).toBe('2026-07-01');
    expect(result[0]!.to).toBe('2026-07-31');
  });
});
