/**
 * `useCancelarVenta` — cancel a ticket of the turno through
 * `CancelarTicketUseCase` (ADR-073), as the web caja's `cancelarTicket` does:
 * the operator's NIP and permission, the header takes the motive, the stock
 * of every line comes back when the business tracks it, and one audit log
 * records the whole ticket. Nothing is edited or deleted.
 */
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CancelarTicketUseCase, type CancelarTicketResult } from '@xangarro/application';
import type { TicketId, UserId } from '@xangarro/domain';
import type { AuditedUseCaseConfig } from '@xangarro/observability';
import {
  useCancelacionLogsRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
  useSalesRepository,
  useTicketsRepository,
  useUsersRepository,
} from '../../app/index';
import { useCurrentBusinessId, useUserId } from '../../app-config/index';
import { useFeatureFlag } from '../../hooks/use-feature-flags';
import { estadosKeys } from '../../hooks/query-keys';
import { useAuditedUseCase } from '../../observability/index';

export interface CancelarVentaInput {
  readonly ticketId: string;
  readonly nip: string;
  /** The motive, with the note for the owner when there is one. */
  readonly motivo: string;
}

type Input = Parameters<CancelarTicketUseCase['execute']>[0];

const AUDIT: AuditedUseCaseConfig<Input, CancelarTicketResult> = {
  operation: 'venta.cancelar',
  entityType: 'ticket',
  extractEntityId: (_r, input) => input.ticketId,
  extractMetadata: (input, r) => ({
    motivo: input.motivo,
    cashToReturn: String(r?.cashToReturn ?? ''),
  }),
};

/** What a cancellation moves: the lists, the expected cash, the stock, the accounts. */
const TOCADAS = new Set([
  'ventas-turno',
  'ventas',
  'productos-con-stock',
  'efectivo-esperado',
  'caja-balance-tickets',
  'caja-balance-sales',
  'ticket',
  'shell',
  'cobrar',
  'inicio',
]);

function useUseCase(): CancelarTicketUseCase {
  const tickets = useTicketsRepository();
  const sales = useSalesRepository();
  const users = useUsersRepository();
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const logs = useCancelacionLogsRepository();
  return useMemo(
    () => new CancelarTicketUseCase(tickets, sales, users, products, movements, logs),
    [tickets, sales, users, products, movements, logs],
  );
}

export function useCancelarVenta() {
  const useCase = useAuditedUseCase(useUseCase(), AUDIT);
  const businessId = useCurrentBusinessId();
  const userId = useUserId();
  const stockEnabled = useFeatureFlag('stock');
  const queryClient = useQueryClient();
  return useMutation<CancelarTicketResult, Error, CancelarVentaInput>({
    async mutationFn(i) {
      if (!businessId || !userId) throw new Error('No hay nadie en la caja');
      return useCase.execute({
        ticketId: i.ticketId as TicketId,
        userId: userId as UserId,
        pin: i.nip,
        motivo: i.motivo,
        businessId,
        stockEnabled,
      });
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ predicate: (q) => TOCADAS.has(String(q.queryKey[0])) }),
        ...estadosKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
    },
  });
}
