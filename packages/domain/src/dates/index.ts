/**
 * Date handling for the domain layer.
 *
 * We store and pass dates as ISO 8601 strings (YYYY-MM-DD for calendar dates,
 * full ISO timestamps for audit fields). This keeps the domain layer free
 * of `Date` objects that carry implicit timezone semantics and are
 * serialization-hostile.
 */

/** Calendar date in YYYY-MM-DD form. */
export type IsoDate = string & { readonly __brand: 'IsoDate' };

/** Full ISO 8601 timestamp in UTC, e.g. "2026-04-23T15:30:00.000Z". */
export type IsoTimestamp = string & { readonly __brand: 'IsoTimestamp' };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a string as an IsoDate, throwing if invalid.
 *
 * The date must **round-trip**: `2026-02-30` is a well-formed string that
 * `Date` silently rolls over into March 2, so a range ending on it read two
 * days of the next month (audit R3-14). A day that does not exist is refused.
 */
export function parseIsoDate(s: string): IsoDate {
  if (!ISO_DATE_RE.test(s)) {
    throw new TypeError(`Invalid ISO date: "${s}". Expected YYYY-MM-DD.`);
  }
  const date = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== s) {
    throw new TypeError(`Invalid ISO date: "${s}".`);
  }
  return s as IsoDate;
}

/** Whether `s` is a real `YYYY-MM-DD` day — `parseIsoDate` without the throw. */
export function esIsoDate(s: string | null | undefined): s is IsoDate {
  if (typeof s !== 'string') return false;
  try {
    parseIsoDate(s);
    return true;
  } catch {
    return false;
  }
}

/** Today as IsoDate (UTC). */
export function today(): IsoDate {
  return new Date().toISOString().slice(0, 10) as IsoDate;
}

/** Current time as IsoTimestamp. */
export function now(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

/** Extract the YYYY-MM (year-month) prefix from an IsoDate. */
export function yearMonth(date: IsoDate): string {
  return date.slice(0, 7);
}

/** Extract the YYYY prefix from an IsoDate. */
export function year(date: IsoDate): string {
  return date.slice(0, 4);
}
export * from './periodo.js';
