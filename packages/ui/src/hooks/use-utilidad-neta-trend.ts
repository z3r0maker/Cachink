/**
 * `useUtilidadNetaTrend` — computes the last 6 months of utilidad neta
 * for the Sparkline on the ResumenCard.
 *
 * Pattern follows `use-indicadores-trend.ts`.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { PeriodRange } from '@cachink/domain';
import { useBusinessesRepository, useExpensesRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { composeEstadoResultados } from './use-estado-resultados';
import { previousNMonths } from './use-indicadores-trend';
import { moneyToNumber } from '../charts/chart-tokens';

export interface UtilidadNetaTrend {
  /** Last 6 months of utilidad neta as numbers (for Sparkline). */
  readonly points: readonly number[];
  /** Short month labels, e.g. ["Ene", "Feb", ...]. */
  readonly labels: readonly string[];
}

const MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

export interface UseUtilidadNetaTrendOptions {
  readonly periodo: PeriodRange;
}

export function useUtilidadNetaTrend(
  options: UseUtilidadNetaTrendOptions,
): UseQueryResult<UtilidadNetaTrend, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const businesses = useBusinessesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<UtilidadNetaTrend, Error>({
    queryKey: ['utilidad-neta-trend', businessId, options.periodo.from, options.periodo.to],
    enabled: businessId !== null,
    staleTime: 5 * 60 * 1000,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      const months = previousNMonths(options.periodo, 6);
      const results = await Promise.all(
        months.map((p) => composeEstadoResultados(sales, expenses, businesses, businessId, p)),
      );
      return {
        points: results.map((r) => moneyToNumber(r.utilidadNeta)),
        labels: months.map((m) => {
          const monthIdx = Number(m.from.split('-')[1]) - 1;
          return MONTH_LABELS[monthIdx] ?? '';
        }),
      };
    },
  });
}
