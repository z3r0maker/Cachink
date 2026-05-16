import { describe, expect, it } from 'vitest';
import type { IsoDate, PeriodRange } from '@cachink/domain';
import { priorPeriod } from '../../src/hooks/use-prior-period';

describe('priorPeriod', () => {
  it('monthly → previous month', () => {
    const current: PeriodRange = { from: '2026-04-01' as IsoDate, to: '2026-04-30' as IsoDate };
    const prior = priorPeriod(current);
    expect(prior.from).toBe('2026-03-01');
    expect(prior.to).toBe('2026-03-31');
  });

  it('monthly January → previous December', () => {
    const current: PeriodRange = { from: '2026-01-01' as IsoDate, to: '2026-01-31' as IsoDate };
    const prior = priorPeriod(current);
    expect(prior.from).toBe('2025-12-01');
    expect(prior.to).toBe('2025-12-31');
  });

  it('monthly February handles leap year', () => {
    const current: PeriodRange = { from: '2024-03-01' as IsoDate, to: '2024-03-31' as IsoDate };
    const prior = priorPeriod(current);
    expect(prior.from).toBe('2024-02-01');
    expect(prior.to).toBe('2024-02-29'); // 2024 is a leap year
  });

  it('annual → previous year', () => {
    const current: PeriodRange = { from: '2026-01-01' as IsoDate, to: '2026-12-31' as IsoDate };
    const prior = priorPeriod(current);
    expect(prior.from).toBe('2025-01-01');
    expect(prior.to).toBe('2025-12-31');
  });

  it('custom range → shifted back by range length', () => {
    // 10-day range: Apr 10 to Apr 19
    const current: PeriodRange = { from: '2026-04-10' as IsoDate, to: '2026-04-19' as IsoDate };
    const prior = priorPeriod(current);
    // 10 days back from Apr 10 → Mar 31, ending Apr 9
    expect(prior.from).toBe('2026-03-31');
    expect(prior.to).toBe('2026-04-09');
  });

  it('custom range spanning month boundary', () => {
    // 15-day range: Mar 20 to Apr 3
    const current: PeriodRange = { from: '2026-03-20' as IsoDate, to: '2026-04-03' as IsoDate };
    const prior = priorPeriod(current);
    // 15 days back from Mar 20 → Mar 5, ending Mar 19
    expect(prior.from).toBe('2026-03-05');
    expect(prior.to).toBe('2026-03-19');
  });
});
