/**
 * `useRegistrarEgreso` — TanStack mutation wrapping
 * `RegistrarEgresoUseCase`, with the gasto's receipt photo when the sheet
 * took one (M-18). Invalidates
 * `['egresos', businessId, fecha]` so the list refreshes immediately.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { RegistrarEgresoUseCase, type RegistrarEgresoInput } from '@xangarro/application';
import { useRecordQuota } from '../entitlement/use-record-quota';
import { warnAfterCapture } from '../entitlement/plan-limit-store';
import type { Expense } from '@xangarro/domain';
import {
  useExpenseReceiptsRepository,
  useExpensesRepository,
  useRecurringExpensesRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { estadosKeys } from './query-keys';
import { useAuditedUseCase } from '../observability/index';
import { AUDIT_REGISTRAR_EGRESO } from '../observability/audit-configs';

export type RegistrarEgresoResult = UseMutationResult<
  Expense,
  Error,
  RegistrarEgresoInput,
  unknown
>;

export function useRegistrarEgreso(): RegistrarEgresoResult {
  const expenses = useExpensesRepository();
  const recurring = useRecurringExpensesRepository();
  const receipts = useExpenseReceiptsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const quota = useRecordQuota();
  const rawUseCase = useMemo(
    () => new RegistrarEgresoUseCase(expenses, recurring, quota, receipts),
    [expenses, recurring, quota, receipts],
  );
  const useCase = useAuditedUseCase(rawUseCase, AUDIT_REGISTRAR_EGRESO);

  return useMutation<Expense, Error, RegistrarEgresoInput>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess(egreso) {
      await warnAfterCapture(quota);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['egresos', businessId, egreso.fecha] }),
        ...estadosKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
    },
  });
}
