/**
 * `useDescartarGastoRecurrente` — TanStack mutation wrapping
 * `DescartarGastoRecurrenteUseCase`. Called when the user taps
 * Descartar on a row of the PendientesCard.
 *
 * On success the use-case has advanced the template's proximoDisparo
 * to the next cycle WITHOUT creating an egreso. The hook invalidates
 * the recurrentes query so the PendientesCard refreshes.
 */

import { useMemo } from 'react';
import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  DescartarGastoRecurrenteUseCase,
  type DescartarGastoRecurrenteInput,
  type DescartarGastoRecurrenteResult,
} from '@cachink/application';
import { useRecurringExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_DESCARTAR_RECURRENTE } from '../observability/audit-configs';

export type DescartarGastoRecurrenteHookResult = UseMutationResult<
  DescartarGastoRecurrenteResult,
  Error,
  DescartarGastoRecurrenteInput,
  unknown
>;

export function useDescartarGastoRecurrente(): DescartarGastoRecurrenteHookResult {
  const recurring = useRecurringExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const useCase = useMemo(() => new DescartarGastoRecurrenteUseCase(recurring), [recurring]);

  return useAuditedMutation(MUTATION_DESCARTAR_RECURRENTE, {
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['recurrentes', businessId] });
    },
  });
}
