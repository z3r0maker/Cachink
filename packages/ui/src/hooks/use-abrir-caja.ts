/**
 * `useAbrirCaja` — TanStack mutation wrapping `AbrirCajaUseCase`.
 * Invalidates caja-related queries so status cards and modals update.
 *
 * Issue 5 fix — Second Audit.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { AbrirCajaUseCase } from '@cachink/application';
import { today } from '@cachink/domain';
import type { BusinessId, CajaTurno, Money, UserId } from '@cachink/domain';
import { useCajaTurnosRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { cajaKeys } from './query-keys';
import { useAuditedUseCase } from '../observability/index';
import { AUDIT_ABRIR_CAJA } from '../observability/audit-configs';

export interface AbrirCajaInput {
  readonly userId: UserId;
  readonly montoAperturaCentavos: Money;
  readonly efectivoAdicionalCentavos?: Money;
}

export type AbrirCajaResult = UseMutationResult<CajaTurno, Error, AbrirCajaInput, unknown>;

export function useAbrirCaja(): AbrirCajaResult {
  const turnos = useCajaTurnosRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  const rawUseCase = useMemo(() => new AbrirCajaUseCase(turnos), [turnos]);
  const useCase = useAuditedUseCase(rawUseCase, AUDIT_ABRIR_CAJA);

  return useMutation<CajaTurno, Error, AbrirCajaInput>({
    async mutationFn(input) {
      if (!businessId) {
        throw new Error('useAbrirCaja: no current business set');
      }
      return useCase.execute({
        userId: input.userId,
        fecha: today(),
        montoAperturaCentavos: input.montoAperturaCentavos,
        efectivoAdicionalCentavos: input.efectivoAdicionalCentavos ?? 0n,
        businessId: businessId,
      });
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: cajaKeys.byBusiness(businessId as BusinessId),
        }),
        queryClient.invalidateQueries({
          queryKey: ['caja-open'],
        }),
      ]);
    },
  });
}
