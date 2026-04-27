/**
 * `useCorteGate` — local-time gate for the Corte de Día card on Operativo
 * home (P1C-M7-T01).
 *
 * CLAUDE.md §1 specifies the corte card appears "after 18:00 local time".
 * The gate is a pure check against the device clock; the card also
 * disappears once today's corte exists, but that's driven by the parent
 * via `useCorteDelDia` — this hook only owns the time branch.
 *
 * Extracted into its own hook so the card's visibility is testable in
 * isolation with a fake `now` injection. The threshold is configurable
 * (default 18) so desktop / other regions can tweak without forking.
 */

import { useMemo } from 'react';

export interface UseCorteGateOptions {
  /** Hour (local time, 0–23) past which the card becomes visible. */
  readonly threshold?: number;
  /**
   * Dependency-injected clock. Tests pass a fake Date; production code
   * relies on the default `() => new Date()`.
   */
  readonly now?: () => Date;
}

export interface CorteGateResult {
  readonly shouldShow: boolean;
}

const DEFAULT_THRESHOLD = 18;

export function computeCorteGate(options: UseCorteGateOptions = {}): CorteGateResult {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const now = (options.now ?? (() => new Date()))();
  return { shouldShow: now.getHours() >= threshold };
}

export function useCorteGate(options: UseCorteGateOptions = {}): CorteGateResult {
  // Memoize against the two inputs so parents don't re-render downstream
  // on every tick. The clock is only read once per render — consumers
  // that need second-level precision should poll the card manually.
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const now = options.now;
  return useMemo(() => computeCorteGate({ threshold, now }), [threshold, now]);
}
