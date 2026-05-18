/**
 * `useEliminarEgreso` — TanStack mutation wrapping
 * `ExpensesRepository.delete` (soft-delete). Invalidates the matching
 * ['egresos', businessId, fecha] query.
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ExpenseId, IsoDate } from '@cachink/domain';
import { useExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_ELIMINAR_EGRESO } from '../observability/audit-configs';

export interface EliminarEgresoInput {
  readonly id: ExpenseId;
  readonly fecha: IsoDate;
}

export type EliminarEgresoResult = UseMutationResult<void, Error, EliminarEgresoInput, unknown>;

export function useEliminarEgreso(): EliminarEgresoResult {
  const expenses = useExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useAuditedMutation(MUTATION_ELIMINAR_EGRESO, {
    async mutationFn(input) {
      await expenses.delete(input.id);
    },
    async onSuccess(_void, variables) {
      await queryClient.invalidateQueries({ queryKey: ['egresos', businessId, variables.fecha] });
    },
  });
}
