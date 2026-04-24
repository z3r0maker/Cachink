/**
 * Date formatters — pure presentation helpers built on `Intl`.
 *
 * Inputs are ISO strings so the domain layer stays free of `Date` objects
 * (their implicit-timezone semantics are serialization-hostile, see
 * `../dates`). The functions parse via `${iso}T12:00:00Z` so day-boundary
 * timezone shifts can never push the displayed date one day off the
 * stored date — we deliberately render at noon UTC, then format in es-MX.
 *
 * `formatMonth(yearMonth)` accepts a "YYYY-MM" string (the same shape
 * `yearMonth(IsoDate)` returns).
 */
import type { IsoDate } from '../dates/index.js';

const LOCALE = 'es-MX';

const SHORT = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const LONG = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const MONTH = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
});

const YEAR_MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

function asNoonUtc(iso: IsoDate): Date {
  return new Date(`${iso}T12:00:00Z`);
}

/** "23 abr 2026" — short calendar form for list rows / table cells. */
export function formatDate(date: IsoDate): string {
  return SHORT.format(asNoonUtc(date));
}

/** "miércoles, 23 de abril de 2026" — long form for headers / receipts. */
export function formatDateLong(date: IsoDate): string {
  return LONG.format(asNoonUtc(date));
}

/** "abril 2026" — month + year header form. Input: "YYYY-MM". */
export function formatMonth(yearMonth: string): string {
  if (!YEAR_MONTH_RE.test(yearMonth)) {
    throw new TypeError(
      `Invalid yearMonth: "${yearMonth}". Expected YYYY-MM with a 01..12 month.`,
    );
  }
  return MONTH.format(new Date(`${yearMonth}-01T12:00:00Z`));
}
