/**
 * `useEgresosPorCategoria` — groups expenses by category for the Donut chart
 * in the Estado de Resultados screen.
 *
 * Exports both a pure compose function (for tests) and the React Query hook.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  ZERO,
  type BusinessId,
  type ExpenseCategory,
  type Money,
  type PeriodRange,
} from '@cachink/domain';
import type { ExpensesRepository } from '@cachink/data';
import { useExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { collectExpensesInRange } from './use-estado-resultados';

export interface EgresoPorCategoria {
  readonly categoria: ExpenseCategory;
  readonly total: Money;
}

/**
 * Pure composition — groups expenses by `categoria` within a period range.
 * Results are sorted descending by total.
 */
export async function composeEgresosPorCategoria(
  expenses: ExpensesRepository,
  businessId: BusinessId,
  periodo: PeriodRange,
): Promise<readonly EgresoPorCategoria[]> {
  const egresos = await collectExpensesInRange(expenses, businessId, periodo);
  const map = new Map<ExpenseCategory, Money>();
  for (const e of egresos) {
    map.set(e.categoria, (map.get(e.categoria) ?? ZERO) + e.monto);
  }
  return [...map.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => Number(b.total - a.total));
}

export interface UseEgresosPorCategoriaOptions {
  readonly periodo: PeriodRange;
}

export function useEgresosPorCategoria(
  options: UseEgresosPorCategoriaOptions,
): UseQueryResult<readonly EgresoPorCategoria[], Error> {
  const expenses = useExpensesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly EgresoPorCategoria[], Error>({
    queryKey: ['egresos-por-categoria', businessId, options.periodo.from, options.periodo.to],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      return composeEgresosPorCategoria(expenses, businessId, options.periodo);
    },
  });
}
