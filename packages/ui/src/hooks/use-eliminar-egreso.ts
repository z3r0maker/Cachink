/**
 * `useEliminarEgreso` — TanStack mutation wrapping
 * `ExpensesRepository.delete` (soft-delete). Invalidates the matching
 * ['egresos', businessId, fecha] query.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ExpenseId, IsoDate } from '@cachink/domain';
import { useExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface EliminarEgresoInput {
  readonly id: ExpenseId;
  readonly fecha: IsoDate;
}

export type EliminarEgresoResult = UseMutationResult<void, Error, EliminarEgresoInput, unknown>;

export function useEliminarEgreso(): EliminarEgresoResult {
  const expenses = useExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<void, Error, EliminarEgresoInput>({
    async mutationFn(input) {
      await expenses.delete(input.id);
    },
    async onSuccess(_void, variables) {
      await queryClient.invalidateQueries({ queryKey: ['egresos', businessId, variables.fecha] });
    },
  });
}
