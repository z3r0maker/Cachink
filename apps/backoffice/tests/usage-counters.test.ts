import { describe, expect, it } from 'vitest';

import { usageCounters } from '@/server/usage/counters';
import type { UsageListResult } from '@/server/usage/list';
import type { UsageRow } from '@/server/usage/row';

function row(tx: number, percent: number | null, flags: Partial<UsageRow> = {}): UsageRow {
  const metric = (value: number, p: number | null) => ({
    value,
    limit: null,
    percent: p,
    band: null,
  });
  return {
    current: { transactions: metric(tx, percent), activeProducts: metric(3, null) },
    previous: { period: '2026-08', transactions: tx * 2, activeProducts: 3 },
    overLimit: false,
    twoMonthsOver: false,
    ...flags,
  } as unknown as UsageRow;
}

const result = (rows: UsageRow[], nextCursor: string | null = null) =>
  ({ period: '2026-09', rows, nextCursor, partial: false, billingKnown: false }) as UsageListResult;

describe('usageCounters', () => {
  it('adds up the month, the month before and the highest percent', () => {
    const c = usageCounters(result([row(40, 1), row(48, null)]));
    expect(c).toMatchObject({
      transactions: 88,
      previous: 176,
      businesses: 2,
      more: false,
      overLimit: 0,
      twoMonthsOver: 0,
      topPercent: 1,
    });
  });

  it('counts who is over and who has been over twice, and marks a partial read', () => {
    const c = usageCounters(
      result([row(900, 112, { overLimit: true, twoMonthsOver: true }), row(1, null)], 'next'),
    );
    expect(c.overLimit).toBe(1);
    expect(c.twoMonthsOver).toBe(1);
    expect(c.more).toBe(true);
  });

  it('has no top percent when nobody has a limit', () => {
    expect(usageCounters(result([row(5, null)])).topPercent).toBeNull();
  });
});
