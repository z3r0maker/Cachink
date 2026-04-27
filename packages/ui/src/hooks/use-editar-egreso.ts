/**
 * `useEditarEgreso` — TanStack mutation wrapping
 * `EditarEgresoUseCase.execute`. Invalidates egresos queries on
 * success so the lists / Estados-financieros surfaces refresh.
 *
 * Audit Round 2 J2: powers the swipe-to-edit handler on the Egresos
 * list (Phase K wiring).
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { Expense, ExpenseId } from '@cachink/domain';
import type { ExpensePatch } from '@cachink/data';
import { EditarEgresoUseCase } from '@cachink/application';
import { useExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface EditarEgresoInput {
  readonly id: ExpenseId;
  readonly patch: ExpensePatch;
}

export type EditarEgresoResult = UseMutationResult<Expense, Error, EditarEgresoInput, unknown>;

export function useEditarEgreso(): EditarEgresoResult {
  const expenses = useExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  const useCase = useMemo(() => new EditarEgresoUseCase(expenses), [expenses]);

  return useMutation<Expense, Error, EditarEgresoInput>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['expenses', businessId] });
    },
  });
}
