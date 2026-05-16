/**
 * `useFlujoEfectivoDelta` — fetches the Flujo de Efectivo for the
 * prior period to enable delta comparisons.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { FlujoDeEfectivo, PeriodRange } from '@cachink/domain';
import {
  useClientPaymentsRepository,
  useExpensesRepository,
  useSalesRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { composeFlujoEfectivo } from './use-flujo-efectivo';
import { priorPeriod } from './use-prior-period';

export interface UseFlujoEfectivoDeltaOptions {
  readonly periodo: PeriodRange;
}

export function useFlujoEfectivoDelta(
  options: UseFlujoEfectivoDeltaOptions,
): UseQueryResult<FlujoDeEfectivo | null, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const clientPayments = useClientPaymentsRepository();
  const businessId = useCurrentBusinessId();
  const prior = priorPeriod(options.periodo);

  return useQuery<FlujoDeEfectivo | null, Error>({
    queryKey: ['flujo-efectivo-delta', businessId, prior.from, prior.to],
    enabled: businessId !== null,
    staleTime: 5 * 60 * 1000,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      return composeFlujoEfectivo(sales, expenses, clientPayments, businessId, prior);
    },
  });
}
