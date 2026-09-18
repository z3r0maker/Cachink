/**
 * The usage period is the business-local calendar month, `'YYYY-MM'`.
 *
 * Offsets are never hard-coded: `Intl` resolves the zone's rules at the
 * instant, so a DST zone (e.g. America/Tijuana) and a future rule change both
 * land in the right month.
 */

import {
  InvalidUsageDateError,
  InvalidUsagePeriodError,
  InvalidUsageTimeZoneError,
} from './errors.js';
import type { UsagePeriod } from './types.js';

export const DEFAULT_USAGE_TIME_ZONE = 'America/Mexico_City';

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone);
  if (cached) return cached;
  let created: Intl.DateTimeFormat;
  try {
    created = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit' });
  } catch {
    throw new InvalidUsageTimeZoneError(timeZone);
  }
  formatters.set(timeZone, created);
  return created;
}

export function usagePeriod(
  date: Date | string,
  timeZone: string = DEFAULT_USAGE_TIME_ZONE,
): UsagePeriod {
  const instant = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(instant.getTime())) throw new InvalidUsageDateError(String(date));
  const parts = formatterFor(timeZone).formatToParts(instant);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  return `${year.padStart(4, '0')}-${month}`;
}

export function isUsagePeriod(value: string): boolean {
  return PERIOD_RE.test(value);
}

export function assertUsagePeriod(value: string): void {
  if (!isUsagePeriod(value)) throw new InvalidUsagePeriodError(value);
}

/** The month after `period`. */
export function nextUsagePeriod(period: UsagePeriod): UsagePeriod {
  assertUsagePeriod(period);
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  return month === 12
    ? `${String(year + 1).padStart(4, '0')}-01`
    : `${period.slice(0, 4)}-${String(month + 1).padStart(2, '0')}`;
}
