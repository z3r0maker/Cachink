/**
 * Period helpers shared by the NIF financial calculations.
 *
 * The calc functions do NOT filter by date themselves — CLAUDE.md §10
 * requires callers to pre-filter by period (so the same pure function
 * handles monthly, annual, and custom ranges without knowing about dates).
 * This file just captures the shape callers use when they DO want a
 * typed period handle.
 */

import type { IsoDate } from '../dates/index.js';

export interface PeriodRange {
  from: IsoDate;
  to: IsoDate;
}

/** Check whether an IsoDate falls within an inclusive period range. */
export function isInPeriod(date: IsoDate, period: PeriodRange): boolean {
  return date >= period.from && date <= period.to;
}
