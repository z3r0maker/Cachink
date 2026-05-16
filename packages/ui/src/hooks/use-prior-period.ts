/**
 * `priorPeriod` — compute the equivalent prior period for delta comparisons.
 *
 * Monthly → previous month. Annual → previous year. Custom → same-length
 * range shifted back by its own length.
 */

import type { IsoDate, PeriodRange } from '@cachink/domain';

/** Day count in a period (inclusive). */
function dayCount(p: PeriodRange): number {
  const fromMs = Date.parse(`${p.from}T00:00:00Z`);
  const toMs = Date.parse(`${p.to}T00:00:00Z`);
  return Math.max(1, Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000)) + 1);
}

function toIso(d: Date): IsoDate {
  return d.toISOString().slice(0, 10) as IsoDate;
}

function isMonthRange(p: PeriodRange): boolean {
  const [fy, fm] = p.from.split('-').map(Number) as [number, number, number];
  const [ty, tm, td] = p.to.split('-').map(Number) as [number, number, number];
  if (fy !== ty || fm !== tm) return false;
  const fd = Number(p.from.split('-')[2]);
  if (fd !== 1) return false;
  const daysInMonth = new Date(ty, tm, 0).getDate();
  return td === daysInMonth;
}

function isYearRange(p: PeriodRange): boolean {
  return p.from.endsWith('-01-01') && p.to.endsWith('-12-31');
}

/**
 * Compute the equivalent prior period.
 *
 * - Monthly range → previous month
 * - Annual range → previous year
 * - Custom range → shift back by the range's length in days
 */
export function priorPeriod(current: PeriodRange): PeriodRange {
  if (isYearRange(current)) {
    const y = Number(current.from.slice(0, 4));
    return {
      from: `${y - 1}-01-01` as IsoDate,
      to: `${y - 1}-12-31` as IsoDate,
    };
  }

  if (isMonthRange(current)) {
    const [y, m] = current.from.split('-').map(Number) as [number, number];
    let py = y;
    let pm = m - 1;
    if (pm <= 0) {
      pm = 12;
      py -= 1;
    }
    const daysInPrevMonth = new Date(py, pm, 0).getDate();
    const from = `${String(py).padStart(4, '0')}-${String(pm).padStart(2, '0')}-01` as IsoDate;
    const to =
      `${String(py).padStart(4, '0')}-${String(pm).padStart(2, '0')}-${String(daysInPrevMonth).padStart(2, '0')}` as IsoDate;
    return { from, to };
  }

  // Custom range — shift back by the same number of days.
  const days = dayCount(current);
  const fromDate = new Date(`${current.from}T00:00:00Z`);
  fromDate.setUTCDate(fromDate.getUTCDate() - days);
  const toDate = new Date(`${current.from}T00:00:00Z`);
  toDate.setUTCDate(toDate.getUTCDate() - 1);

  return { from: toIso(fromDate), to: toIso(toDate) };
}
