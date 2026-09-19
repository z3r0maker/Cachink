/**
 * `useRegistrarPago` — TanStack mutation wrapping
 * `RegistrarPagoClienteUseCase` per ADR-024. An abono belongs to the client
 * (ADR-074); the balance it leaves is derived, so the UI only fires this one
 * mutation and invalidates the dependent queries on success.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { RegistrarPagoClienteUseCase } from '@xangarro/application';
import type { ClientPayment, NewClientPayment } from '@xangarro/domain';
import { useClientPaymentsRepository, useClientsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { estadosKeys, pagoKeys } from './query-keys';
import { useAuditedUseCase } from '../observability/index';
import { AUDIT_REGISTRAR_PAGO } from '../observability/audit-configs';

export type RegistrarPagoResult = UseMutationResult<
  ClientPayment,
  Error,
  NewClientPayment,
  unknown
>;

export function useRegistrarPago(): RegistrarPagoResult {
  const payments = useClientPaymentsRepository();
  const clients = useClientsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const rawUseCase = useMemo(
    () => new RegistrarPagoClienteUseCase(payments, clients),
    [payments, clients],
  );
  const useCase = useAuditedUseCase(rawUseCase, AUDIT_REGISTRAR_PAGO);

  return useMutation<ClientPayment, Error, NewClientPayment>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess() {
      // Invalidate every surface that derives from Crédito state. A
      // pago moves cash and clears a receivable, so Flujo de Efectivo
      // and Balance General are downstream of it too.
      await Promise.all([
        ...pagoKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        ...estadosKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
    },
  });
}
