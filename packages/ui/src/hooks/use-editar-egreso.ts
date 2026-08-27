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
import { estadosKeys } from './query-keys';
import { useAuditedUseCase } from '../observability/index';
import { AUDIT_EDITAR_EGRESO } from '../observability/audit-configs';

export interface EditarEgresoInput {
  readonly id: ExpenseId;
  readonly patch: ExpensePatch;
}

export type EditarEgresoResult = UseMutationResult<Expense, Error, EditarEgresoInput, unknown>;

export function useEditarEgreso(): EditarEgresoResult {
  const expenses = useExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  const rawUseCase = useMemo(() => new EditarEgresoUseCase(expenses), [expenses]);
  const useCase = useAuditedUseCase(rawUseCase, AUDIT_EDITAR_EGRESO);

  return useMutation<Expense, Error, EditarEgresoInput>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess() {
      // `['expenses', …]` was a dead key — the egresos list caches
      // under `['egresos', businessId, fecha]`.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['egresos', businessId] }),
        ...estadosKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
    },
  });
}
