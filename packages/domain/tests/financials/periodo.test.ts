import { describe, expect, it } from 'vitest';
import type { IsoDate } from '../../src/dates/index.js';
import { isInPeriod } from '../../src/financials/index.js';

const period = {
  from: '2026-04-01' as IsoDate,
  to: '2026-04-30' as IsoDate,
};

describe('isInPeriod', () => {
  it('returns true for both endpoints (inclusive range)', () => {
    expect(isInPeriod('2026-04-01' as IsoDate, period)).toBe(true);
    expect(isInPeriod('2026-04-30' as IsoDate, period)).toBe(true);
  });

  it('returns true for a date in the middle', () => {
    expect(isInPeriod('2026-04-15' as IsoDate, period)).toBe(true);
  });

  it('returns false for dates before or after the range', () => {
    expect(isInPeriod('2026-03-31' as IsoDate, period)).toBe(false);
    expect(isInPeriod('2026-05-01' as IsoDate, period)).toBe(false);
  });
});
