import type { UsageListResult } from './list';

/** The three numbers on top of Uso, read from one unfiltered page of tenants. */
export interface UsageCounters {
  readonly period: string;
  readonly transactions: number;
  readonly previous: number;
  readonly businesses: number;
  /** More tenants exist beyond the page read: the totals are a floor. */
  readonly more: boolean;
  readonly overLimit: number;
  readonly twoMonthsOver: number;
  /** The highest percent any tenant reached on any limited metric; null if none is limited. */
  readonly topPercent: number | null;
}

export function usageCounters(r: UsageListResult): UsageCounters {
  let transactions = 0;
  let previous = 0;
  let topPercent: number | null = null;
  for (const row of r.rows) {
    transactions += row.current.transactions.value;
    previous += row.previous?.transactions ?? 0;
    for (const m of Object.values(row.current)) {
      if (m.percent !== null) topPercent = Math.max(topPercent ?? 0, m.percent);
    }
  }
  return {
    period: r.period,
    transactions,
    previous,
    businesses: r.rows.length,
    more: r.nextCursor !== null,
    overLimit: r.rows.filter((x) => x.overLimit).length,
    twoMonthsOver: r.rows.filter((x) => x.twoMonthsOver).length,
    topPercent,
  };
}
