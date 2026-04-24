/**
 * `useRegistrarEgreso` — TanStack mutation wrapping
 * `RegistrarEgresoUseCase`. Invalidates
 * `['egresos', businessId, fecha]` so the list refreshes immediately.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { RegistrarEgresoUseCase } from '@cachink/application';
import type { Expense, NewExpense } from '@cachink/domain';
import { useExpensesRepository, useRecurringExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export type RegistrarEgresoResult = UseMutationResult<Expense, Error, NewExpense, unknown>;

export function useRegistrarEgreso(): RegistrarEgresoResult {
  const expenses = useExpensesRepository();
  const recurring = useRecurringExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const useCase = useMemo(
    () => new RegistrarEgresoUseCase(expenses, recurring),
    [expenses, recurring],
  );

  return useMutation<Expense, Error, NewExpense>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess(egreso) {
      await queryClient.invalidateQueries({ queryKey: ['egresos', businessId, egreso.fecha] });
    },
  });
}
