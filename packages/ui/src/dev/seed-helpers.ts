/**
 * Shared date helpers for the demo seed pipeline.
 *
 * Pure functions — no side effects, no imports from app layer.
 */

import type { IsoDate, IsoTimestamp } from '@cachink/domain';

/** Format a Date to YYYY-MM-DD (IsoDate). */
export function toIsoDate(d: Date): IsoDate {
  return d.toISOString().slice(0, 10) as IsoDate;
}

/** Format a Date to HH:MM string. */
export function toHora(d: Date): string {
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Subtract N days from today. */
export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** ISO timestamp string from a Date (branded). */
export function toTs(d: Date): IsoTimestamp {
  return d.toISOString() as IsoTimestamp;
}
