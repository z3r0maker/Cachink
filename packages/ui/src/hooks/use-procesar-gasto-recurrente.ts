/**
 * `useProcesarGastoRecurrente` — TanStack mutation wrapping
 * `ProcesarGastoRecurrenteUseCase`. Called when the user taps
 * Confirmar on a row of the PendientesCard.
 *
 * On success the use-case has (a) created an Egreso linked to the
 * template via gastoRecurrenteId, and (b) advanced the template's
 * proximoDisparo. The hook invalidates both the recurrentes and
 * egresos queries so every dependent view refreshes.
 */

import { useMemo } from 'react';
import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  ProcesarGastoRecurrenteUseCase,
  type ProcesarGastoRecurrenteInput,
  type ProcesarGastoRecurrenteResult,
} from '@cachink/application';
import { useExpensesRepository, useRecurringExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useEmitDirectorAlert } from './use-emit-director-alert';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_PROCESAR_RECURRENTE } from '../observability/audit-configs';

export type ProcesarGastoRecurrenteHookResult = UseMutationResult<
  ProcesarGastoRecurrenteResult,
  Error,
  ProcesarGastoRecurrenteInput,
  unknown
>;

export function useProcesarGastoRecurrente(): ProcesarGastoRecurrenteHookResult {
  const expenses = useExpensesRepository();
  const recurring = useRecurringExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const useCase = useMemo(
    () => new ProcesarGastoRecurrenteUseCase(expenses, recurring),
    [expenses, recurring],
  );

  const emitAlert = useEmitDirectorAlert();

  return useAuditedMutation(MUTATION_PROCESAR_RECURRENTE, {
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess(result) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['recurrentes', businessId] }),
        queryClient.invalidateQueries({
          queryKey: ['egresos', businessId, result.egreso?.fecha],
        }),
      ]);

      // Alert: gasto-recurrente-pendiente
      if (result.egreso) {
        emitAlert.mutate({
          source: 'gasto-recurrente-pendiente',
          severity: 'info',
          titleKey: 'notificaciones.gastoRecurrentePendiente',
          message: `Se confirmó el gasto recurrente: ${result.egreso.concepto}.`,
          actionRoute: '/egresos',
          metadata: JSON.stringify({ egresoId: result.egreso.id }),
        });
      }
    },
  });
}
