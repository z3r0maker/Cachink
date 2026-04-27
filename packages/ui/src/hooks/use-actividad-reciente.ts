/**
 * `useActividadReciente` — composes `useVentasByDate(today)` +
 * `useEgresosByDate(today)` and returns the newest N entries merged
 * together (P1C-M10-T04, S4-C5). Exposes a pure `mergeActividad` so
 * tests exercise the merge/ordering independently of the hooks.
 */

import type { Expense, IsoDate, Sale } from '@cachink/domain';
import { useEgresosByDate } from './use-egresos-by-date';
import { useVentasByDate } from './use-ventas-by-date';

export interface ActividadVenta {
  readonly kind: 'venta';
  readonly createdAt: string;
  readonly item: Sale;
}

export interface ActividadEgreso {
  readonly kind: 'egreso';
  readonly createdAt: string;
  readonly item: Expense;
}

export type ActividadEntry = ActividadVenta | ActividadEgreso;

export interface UseActividadRecienteResult {
  readonly entries: readonly ActividadEntry[];
  readonly loading: boolean;
  readonly error: Error | null;
}

/** Pure merge helper — newest first, at most `limit` entries. */
export function mergeActividad(
  ventas: readonly Sale[],
  egresos: readonly Expense[],
  limit: number,
): readonly ActividadEntry[] {
  const merged: ActividadEntry[] = [
    ...ventas.map<ActividadVenta>((v) => ({
      kind: 'venta',
      createdAt: v.createdAt,
      item: v,
    })),
    ...egresos.map<ActividadEgreso>((e) => ({
      kind: 'egreso',
      createdAt: e.createdAt,
      item: e,
    })),
  ];
  merged.sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
  return merged.slice(0, Math.max(0, limit));
}

export function useActividadReciente(today: IsoDate, limit = 6): UseActividadRecienteResult {
  // P1C-M12-T05 — these queries feed the Director Home activity card.
  // Caller is expected to re-render only on data change; the hook
  // reuses the existing composed queries (useVentasByDate +
  // useEgresosByDate) which already apply staleTime:Infinity.
  const ventasQ = useVentasByDate(today);
  const egresosQ = useEgresosByDate(today);
  const entries = mergeActividad(ventasQ.data ?? [], egresosQ.data ?? [], limit);
  return {
    entries,
    loading: ventasQ.isLoading || egresosQ.isLoading,
    error: (ventasQ.error as Error | null) ?? (egresosQ.error as Error | null),
  };
}
