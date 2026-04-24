/**
 * `useRegistrarPago` — TanStack mutation wrapping
 * `RegistrarPagoClienteUseCase` per ADR-024. The use-case owns the
 * state-flip (pendiente → parcial → pagado) so the UI only fires
 * this one mutation and invalidates the dependent queries on success.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { RegistrarPagoClienteUseCase } from '@cachink/application';
import type { ClientPayment, NewClientPayment } from '@cachink/domain';
import { useClientPaymentsRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export type RegistrarPagoResult = UseMutationResult<
  ClientPayment,
  Error,
  NewClientPayment,
  unknown
>;

export function useRegistrarPago(): RegistrarPagoResult {
  const payments = useClientPaymentsRepository();
  const sales = useSalesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const useCase = useMemo(
    () => new RegistrarPagoClienteUseCase(payments, sales),
    [payments, sales],
  );

  return useMutation<ClientPayment, Error, NewClientPayment>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess() {
      // Invalidate every surface that derives from Crédito state.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ventas', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['cuentasPorCobrar', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['cliente-detail', businessId] }),
      ]);
    },
  });
}
