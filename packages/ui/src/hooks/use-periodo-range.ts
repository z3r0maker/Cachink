/**
 * `usePeriodoRange` — derives `{ from, to }` from the PeriodPicker state
 * (Slice 3 C9).
 *
 * Mensual: first → last day of the selected YYYY-MM.
 * Anual:   first → last day of the selected YYYY.
 * Rango:   the user-provided dates, clamped so `to >= from`.
 *
 * No `Date` math in domain land — CLAUDE.md §10 requires callers to
 * supply pre-computed dates. This is a UI helper.
 */

import { useMemo } from 'react';
import type { IsoDate } from '@cachink/domain';
import type { PeriodoState } from '../components/PeriodPicker/period-picker';

export interface PeriodoRange {
  readonly from: IsoDate;
  readonly to: IsoDate;
}

export function defaultPeriodoState(now: Date = new Date()): PeriodoState {
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const first = `${year}-${month}-01`;
  const last = lastDayOfMonth(Number(year), Number(month));
  return {
    mode: 'mensual',
    year,
    month,
    from: first,
    to: last,
  };
}

/**
 * Pure derivation of `{ from, to }` from the picker's state. Handles
 * the 3 modes + returns a stable range.
 */
export function deriveRange(state: PeriodoState): PeriodoRange {
  switch (state.mode) {
    case 'mensual':
      return mensualRange(state.year, state.month);
    case 'anual':
      return anualRange(state.year);
    case 'rango':
      return rangoRange(state.from, state.to);
  }
}

function mensualRange(year: string, month: string): PeriodoRange {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    const fallback = `${year || '1970'}-${(month || '01').padStart(2, '0')}`;
    return {
      from: `${fallback}-01` as IsoDate,
      to: `${fallback}-31` as IsoDate,
    };
  }
  const mm = String(m).padStart(2, '0');
  return {
    from: `${year}-${mm}-01` as IsoDate,
    to: lastDayOfMonth(y, m) as IsoDate,
  };
}

function anualRange(year: string): PeriodoRange {
  return {
    from: `${year}-01-01` as IsoDate,
    to: `${year}-12-31` as IsoDate,
  };
}

function rangoRange(from: string, to: string): PeriodoRange {
  // Clamp: if `to < from`, treat as a single-day range.
  const effectiveTo = to < from ? from : to;
  return { from: from as IsoDate, to: effectiveTo as IsoDate };
}

/** Last day of the given (1-indexed) month, as `YYYY-MM-DD`. */
function lastDayOfMonth(year: number, month: number): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
}

export function usePeriodoRange(state: PeriodoState): PeriodoRange {
  return useMemo(() => deriveRange(state), [state]);
}
