/**
 * `useCobrarTicket` — the sale as one ticket (ADR-073): every line, the
 * method, the cash received and the client for fiado, through
 * `RegistrarTicketUseCase` in one atomic write with one folio. The old phone
 * checkout looped `useRegistrarVenta` (one ticket per product); that hook
 * stays for its other callers.
 */
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RegistrarTicketUseCase, type RegistrarTicketResult } from '@xangarro/application';
import type { BusinessId, ClientId, Money, ProductId } from '@xangarro/domain';
import type { AuditedUseCaseConfig } from '@xangarro/observability';
import { horaLocal, hoyLocal } from '@xangarro/caja';
import { importe, total, type LineaTicket } from '@xangarro/caja/caja';
import {
  useCajaTurnosRepository,
  useClientsRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
  useSalesRepository,
  useTicketsRepository,
} from '../../app/index';
import { useCurrentBusinessId, useUserId } from '../../app-config/index';
import { useFeatureFlag } from '../../hooks/use-feature-flags';
import { estadosKeys } from '../../hooks/query-keys';
import { useAuditedUseCase } from '../../observability/index';
import { folioTexto, metodoDominio, type MetodoCobro } from './cobro-logic';
import type { VentaHecha } from './venta-hecha';

export interface CobrarTicketInput {
  readonly lines: readonly LineaTicket[];
  readonly metodo: MetodoCobro;
  readonly recibido: Money | null;
  readonly cliente?: { readonly id: ClientId; readonly nombre: string; readonly saldo: Money };
}

type TicketInput = Parameters<RegistrarTicketUseCase['execute']>[0];

const AUDIT_COBRAR_TICKET: AuditedUseCaseConfig<TicketInput, RegistrarTicketResult> = {
  operation: 'venta.registrar',
  entityType: 'ticket',
  extractEntityId: (r) => r.ticket.id,
  extractMetadata: (input) => ({
    metodo: input.ticket.metodo,
    lineas: String(input.lineas.length),
  }),
};

/** Everything a sale moves: the day, the stock, the turno, the accounts. */
const TOCADAS = new Set([
  'ventas',
  'productos-con-stock',
  'frequentProductos',
  'efectivo-esperado',
  'cancelaciones-sales',
  'caja-balance-tickets',
  'caja-balance-sales',
  'caja-balance-movimientos',
  'ticket',
  'shell',
  'cobrar',
]);

export function ticketInput(i: CobrarTicketInput, businessId: BusinessId): TicketInput {
  return {
    ticket: {
      fecha: hoyLocal() as never,
      hora: horaLocal(),
      concepto: i.lines[0]?.nombre ?? 'Venta',
      metodo: metodoDominio(i.metodo),
      clienteId: i.metodo === 'Fiado' ? (i.cliente?.id ?? null) : null,
      efectivoRecibidoCentavos: i.metodo === 'Efectivo' ? i.recibido : null,
      businessId,
    },
    lineas: i.lines.map((l) => ({
      concepto: l.nombre,
      categoria: 'Producto' as const,
      monto: importe(l),
      productoId: l.productoId as ProductId,
      cantidad: l.cantidad,
    })),
  };
}

export function ventaHechaDe(i: CobrarTicketInput, r: RegistrarTicketResult): VentaHecha {
  const t = total(i.lines);
  const efectivo = i.metodo === 'Efectivo' && i.recibido !== null;
  return {
    ticketId: r.ticket.id,
    folio: folioTexto(r.ticket.folio),
    hora: r.ticket.hora ?? horaLocal(),
    lines: i.lines,
    total: t,
    metodo: i.metodo,
    recibido: efectivo ? i.recibido : null,
    cambio: efectivo ? r.ticket.cambioCentavos : null,
    cliente: i.metodo === 'Fiado' ? (i.cliente?.nombre ?? null) : null,
    saldoCliente: i.metodo === 'Fiado' && i.cliente ? i.cliente.saldo + t : null,
  };
}

function useTicketUseCase(): RegistrarTicketUseCase {
  const tickets = useTicketsRepository();
  const sales = useSalesRepository();
  const clients = useClientsRepository();
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const turnos = useCajaTurnosRepository();
  const stockEnabled = useFeatureFlag('stock');
  const userId = useUserId();
  return useMemo(
    () =>
      new RegistrarTicketUseCase(tickets, sales, clients, products, movements, turnos, {
        stockEnabled,
        userId,
      }),
    [tickets, sales, clients, products, movements, turnos, stockEnabled, userId],
  );
}

/**
 * The key-prefixes a sale invalidates besides TOCADAS's first-word matches:
 * the turno's ventas list lives under caja's keys, which TOCADAS cannot see.
 */
export function teclasAlCobrar(businessId: BusinessId | null): readonly (readonly unknown[])[] {
  return [['caja', businessId, 'ventas-turno']];
}

export function useCobrarTicket() {
  const useCase = useAuditedUseCase(useTicketUseCase(), AUDIT_COBRAR_TICKET);
  const businessId = useCurrentBusinessId();
  const queryClient = useQueryClient();
  return useMutation<VentaHecha, Error, CobrarTicketInput>({
    async mutationFn(input) {
      if (!businessId) throw new Error('No hay negocio en esta caja');
      return ventaHechaDe(input, await useCase.execute(ticketInput(input, businessId)));
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ predicate: (q) => TOCADAS.has(String(q.queryKey[0])) }),
        ...estadosKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        ...teclasAlCobrar(businessId).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ]);
    },
  });
}
