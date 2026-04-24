/**
 * `useCrearGastoRecurrente` — TanStack mutation wrapping
 * `RecurringExpensesRepository.create`. Invalidates
 * ['recurrentes', businessId] so the PendientesCard picks up the
 * new template.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { NewRecurringExpense, RecurringExpense } from '@cachink/domain';
import { useRecurringExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export type CrearGastoRecurrenteResult = UseMutationResult<
  RecurringExpense,
  Error,
  NewRecurringExpense,
  unknown
>;

export function useCrearGastoRecurrente(): CrearGastoRecurrenteResult {
  const recurring = useRecurringExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<RecurringExpense, Error, NewRecurringExpense>({
    async mutationFn(input) {
      return recurring.create(input);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['recurrentes', businessId] });
    },
  });
}
