/**
 * «Recibir abono» on the phone (MvCobranza): the abono is recorded whole
 * through `RegistrarPagoClienteUseCase` (ADR-074; an excess is saldo a
 * favor, ADR-083 D5), audited like every capture, and the outbox carries it
 * up. Where it lands (oldest ticket first) is derived, never stored.
 */
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RegistrarPagoClienteUseCase } from '@xangarro/application';
import { hoyLocal } from '@xangarro/caja';
import type { MetodoAbono } from '@xangarro/caja/cobranza';
import type { BusinessId, ClientId, ClientPayment, IsoDate, Money } from '@xangarro/domain';
import { useClientPaymentsRepository, useClientsRepository } from '../../app/index';
import { useCurrentBusinessId } from '../../app-config/index';
import { AUDIT_REGISTRAR_PAGO } from '../../observability/audit-configs';
import { useAuditedUseCase } from '../../observability/use-audited-use-case';

export interface AbonoInput {
  readonly clienteId: string;
  readonly monto: Money;
  readonly metodo: MetodoAbono;
}

/** What an abono moves: the accounts and the picker (`cobrar`), Inicio (`caja`), the shell. */
const TOCADAS = new Set(['cobrar', 'caja', 'shell']);

export function useRegistrarAbono() {
  const payments = useClientPaymentsRepository();
  const clients = useClientsRepository();
  const base = useMemo(
    () => new RegistrarPagoClienteUseCase(payments, clients),
    [payments, clients],
  );
  const useCase = useAuditedUseCase(base, AUDIT_REGISTRAR_PAGO);
  const businessId = useCurrentBusinessId();
  const queryClient = useQueryClient();
  return useMutation<ClientPayment, Error, AbonoInput>({
    async mutationFn(i) {
      if (!businessId) throw new Error('No hay negocio en esta caja');
      return useCase.execute({
        clienteId: i.clienteId as ClientId,
        fecha: hoyLocal() as IsoDate,
        montoCentavos: i.monto,
        metodo: i.metodo,
        businessId: businessId as BusinessId,
      });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        predicate: (q) => TOCADAS.has(String(q.queryKey[0])),
      });
    },
  });
}
