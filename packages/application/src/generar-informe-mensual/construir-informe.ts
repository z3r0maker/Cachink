/**
 * The informe's pure core (extracted from `GenerarInformeMensualUseCase`):
 * ventas + egresos + NIF Estado de Resultados + per-categoría breakdowns.
 *
 * The use case stays format- and store-agnostic; this function is what both
 * stores feed — the phone through its SQLite repositories, the portal through
 * `periodLedger` — so the informe's rules exist in exactly one place.
 */

import {
  calculateEstadoDeResultados,
  type BusinessId,
  type Expense,
  type Money,
  type Sale,
} from '@xangarro/domain';

import type { InformeMensual } from './generar-informe-mensual-use-case.js';

export interface ConstruirInformeInput {
  readonly businessId: BusinessId;
  /** `YYYY-MM`, e.g. `"2026-04"`. */
  readonly yearMonth: string;
  readonly ventas: readonly Sale[];
  readonly egresos: readonly Expense[];
  /** Basis points, from the business row. */
  readonly isrTasa: number;
}

export function construirInforme(input: ConstruirInformeInput): InformeMensual {
  if (!/^\d{4}-\d{2}$/.test(input.yearMonth)) {
    throw new TypeError(`yearMonth must be in YYYY-MM format, got "${input.yearMonth}"`);
  }
  const estadoResultados = calculateEstadoDeResultados({
    ventas: input.ventas,
    egresos: input.egresos,
    isrTasa: input.isrTasa,
  });
  return {
    businessId: input.businessId,
    yearMonth: input.yearMonth,
    ventas: input.ventas,
    egresos: input.egresos,
    estadoResultados,
    ventasPorCategoria: groupByCategory(
      input.ventas,
      (v) => v.categoria,
      (v) => v.monto,
    ),
    egresosPorCategoria: groupByCategory(
      input.egresos,
      (e) => e.categoria,
      (e) => e.monto,
    ),
  };
}

export function groupByCategory<T, K extends string>(
  rows: readonly T[],
  keyOf: (r: T) => K,
  montoOf: (r: T) => Money,
): Record<K, Money> {
  const acc = {} as Record<K, Money>;
  for (const row of rows) {
    const key = keyOf(row);
    acc[key] = (acc[key] ?? 0n) + montoOf(row);
  }
  return acc;
}
