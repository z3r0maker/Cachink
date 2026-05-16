/**
 * `useIndicadoresDelta` — fetches KPIs for the prior period to
 * enable delta comparisons on the Indicadores screen.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Indicadores, PeriodRange } from '@cachink/domain';
import {
  useBusinessesRepository,
  useClientPaymentsRepository,
  useDayClosesRepository,
  useExpensesRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
  useSalesRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { composeIndicadores } from './use-indicadores';
import { priorPeriod } from './use-prior-period';

export interface UseIndicadoresDeltaOptions {
  readonly periodo: PeriodRange;
}

export function useIndicadoresDelta(
  options: UseIndicadoresDeltaOptions,
): UseQueryResult<Indicadores | null, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const businesses = useBusinessesRepository();
  const clientPayments = useClientPaymentsRepository();
  const dayCloses = useDayClosesRepository();
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const businessId = useCurrentBusinessId();
  const prior = priorPeriod(options.periodo);

  return useQuery<Indicadores | null, Error>({
    queryKey: ['indicadores-delta', businessId, prior.from, prior.to],
    enabled: businessId !== null,
    staleTime: 5 * 60 * 1000,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      return composeIndicadores(
        { sales, expenses, businesses, clientPayments, dayCloses, products, movements },
        businessId,
        prior,
      );
    },
  });
}
