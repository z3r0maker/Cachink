/**
 * `useEgresosByDate` — TanStack query wrapping
 * `ExpensesRepository.findByDate` scoped to the current business.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Expense, IsoDate } from '@cachink/domain';
import { useExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export function useEgresosByDate(fecha: IsoDate): UseQueryResult<readonly Expense[], Error> {
  const expenses = useExpensesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly Expense[], Error>({
    queryKey: ['egresos', businessId, fecha],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      return expenses.findByDate(fecha, businessId);
    },
  });
}
