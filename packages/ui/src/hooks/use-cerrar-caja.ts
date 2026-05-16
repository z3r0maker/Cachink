/**
 * `useCerrarCaja` — TanStack mutation wrapping `CerrarCajaUseCase`.
 * Invalidates caja, sales, and expenses queries on close.
 *
 * Issue 5 fix — Second Audit.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { CerrarCajaUseCase, type CerrarCajaFullInput } from '@cachink/application';
import type { BusinessId, CajaTurno, CajaTurnoId, DiscrepancyReason, Money } from '@cachink/domain';
import { useCajaTurnosRepository, useExpensesRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { cajaKeys } from './query-keys';

export interface CerrarCajaHookInput {
  readonly turnoId: CajaTurnoId;
  readonly montoCierreCentavos: Money;
  readonly discrepancyReason: DiscrepancyReason | null;
  readonly explicacion: string | null;
}

export type CerrarCajaResult = UseMutationResult<CajaTurno, Error, CerrarCajaHookInput, unknown>;

export function useCerrarCaja(): CerrarCajaResult {
  const turnos = useCajaTurnosRepository();
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  const useCase = useMemo(
    () => new CerrarCajaUseCase(turnos, sales, expenses),
    [turnos, sales, expenses],
  );

  return useMutation<CajaTurno, Error, CerrarCajaHookInput>({
    async mutationFn(input) {
      if (!businessId) {
        throw new Error('useCerrarCaja: no current business set');
      }
      const fullInput: CerrarCajaFullInput = {
        turnoId: input.turnoId,
        montoCierreCentavos: input.montoCierreCentavos,
        discrepancyReason: input.discrepancyReason,
        explicacion: input.explicacion,
        businessId: businessId as BusinessId,
      };
      return useCase.execute(fullInput);
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: cajaKeys.byBusiness(businessId as BusinessId),
        }),
        queryClient.invalidateQueries({ queryKey: ['caja-open'] }),
        // Auto-created egreso may have been added
        queryClient.invalidateQueries({
          queryKey: ['egresos', businessId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['efectivo-esperado', businessId],
        }),
      ]);
    },
  });
}
