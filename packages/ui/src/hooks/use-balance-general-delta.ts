/**
 * `useBalanceGeneralDelta` — fetches the Balance General for the
 * prior period to enable delta comparisons.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { BalanceGeneral, PeriodRange } from '@cachink/domain';
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
import { composeEstadoResultados } from './use-estado-resultados';
import { composeBalanceGeneral } from './use-balance-general';
import { priorPeriod } from './use-prior-period';

export interface UseBalanceGeneralDeltaOptions {
  readonly periodo: PeriodRange;
}

export function useBalanceGeneralDelta(
  options: UseBalanceGeneralDeltaOptions,
): UseQueryResult<BalanceGeneral | null, Error> {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const businesses = useBusinessesRepository();
  const clientPayments = useClientPaymentsRepository();
  const dayCloses = useDayClosesRepository();
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const businessId = useCurrentBusinessId();
  const prior = priorPeriod(options.periodo);

  return useQuery<BalanceGeneral | null, Error>({
    queryKey: ['balance-general-delta', businessId, prior.from, prior.to],
    enabled: businessId !== null,
    staleTime: 5 * 60 * 1000,
    async queryFn() {
      if (!businessId) throw new Error('No business selected');
      const estado = await composeEstadoResultados(
        sales, expenses, businesses, businessId, prior,
      );
      return composeBalanceGeneral(
        { sales, clientPayments, dayCloses, products, movements },
        businessId,
        prior,
        estado.utilidadNeta,
      );
    },
  });
}
