/**
 * `usePendientesGastosRecurrentes` — TanStack query over
 * RecurringExpensesRepository.findDue(today, businessId). Returns the
 * list of recurring templates whose `proximoDisparo` is on or before
 * today — the PendientesCard iterates over these.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { IsoDate, RecurringExpense } from '@cachink/domain';
import { useRecurringExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export function usePendientesGastosRecurrentes(
  today: IsoDate,
): UseQueryResult<readonly RecurringExpense[], Error> {
  const recurring = useRecurringExpensesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly RecurringExpense[], Error>({
    queryKey: ['recurrentes', businessId, today],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      return recurring.findDue(today, businessId);
    },
  });
}
