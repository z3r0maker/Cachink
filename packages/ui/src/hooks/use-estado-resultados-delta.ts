/**
 * `useEstadoResultadosDelta` — fetches the Estado de Resultados for the
 * prior period to enable delta comparisons in the Resultados screen.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { EstadoDeResultados, PeriodRange } from '@cachink/domain';
import { useBusinessesRepository, useExpensesRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { composeEstadoResultados } from './use-estado-resultados';
import { priorPeriod } from './use-prior-period';

export interface UseEstadoResultadosDeltaOptions {
  readonly periodo: PeriodRange;
}

export function useEstadoResultadosDelta(
  options: UseEstadoResultadosDeltaOptions,
): UseQueryResult<EstadoDeResultados | null, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const businesses = useBusinessesRepository();
  const businessId = useCurrentBusinessId();
  const prior = priorPeriod(options.periodo);

  return useQuery<EstadoDeResultados | null, Error>({
    queryKey: ['estado-resultados-delta', businessId, prior.from, prior.to],
    enabled: businessId !== null,
    staleTime: 5 * 60 * 1000,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      return composeEstadoResultados(sales, expenses, businesses, businessId, prior);
    },
  });
}
