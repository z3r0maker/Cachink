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
  const sales = useSalesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const rawUseCase = useMemo(
    () => new RegistrarPagoClienteUseCase(payments, sales),
    [payments, sales],
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
