/**
 * `useClienteDetail` — TanStack query that resolves everything
 * needed for ClienteDetailScreen: the cliente row, pending ventas,
 * and all pagos grouped by venta.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { conTotales } from '@xangarro/domain';
import type { Client, ClientId, ClientPayment, Money, TicketConTotal } from '@xangarro/domain';
import { estadoDeCuenta } from '@xangarro/domain';
import {
  useClientPaymentsRepository,
  useTicketsRepository,
  useSalesRepository,
  useClientsRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface ClienteDetailData {
  readonly cliente: Client;
  readonly pendingTickets: readonly TicketConTotal[];
  readonly pagosByVenta: ReadonlyMap<string, readonly ClientPayment[]>;
  readonly saldoPendiente: Money;
}

export function useClienteDetail(
  id: ClientId | null,
): UseQueryResult<ClienteDetailData | null, Error> {
  const clients = useClientsRepository();
  const tickets = useTicketsRepository();
  const sales = useSalesRepository();
  const pagos = useClientPaymentsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<ClienteDetailData | null, Error>({
    queryKey: ['cliente-detail', businessId, id],
    enabled: businessId !== null && id !== null,
    async queryFn() {
      if (!id || !businessId) return null;
      const cliente = await clients.findById(id);
      if (!cliente) return null;
      const ticketsAbiertos = await tickets.findPendingByClient(id);
      const todasLasLineas = await sales.findByDateRange('0000-01-01', '9999-12-31', businessId);
      const pendingTickets = conTotales(ticketsAbiertos, todasLasLineas);
      // One abono list per client (ADR-074); the per-venta split shown in the
      // detail is the FIFO application estadoDeCuenta computes.
      const abonos = await pagos.findByCliente(id);
      const byVenta = new Map<string, readonly ClientPayment[]>();
      const cuenta = estadoDeCuenta(
        pendingTickets.map((v) => ({ id: v.ticket.id, fecha: v.ticket.createdAt, monto: v.total })),
        abonos.map((a) => ({ id: a.id, fecha: a.createdAt, monto: a.montoCentavos })),
      );
      let saldoPendiente = 0n as Money;
      for (const v of cuenta.ventas) {
        byVenta.set(v.id, []);
        saldoPendiente = (saldoPendiente + v.pendiente) as Money;
      }
      for (const a of abonos) {
        const hasta = cuenta.hasta[a.id];
        if (hasta) {
          const rows = byVenta.get(hasta) ?? [];
          byVenta.set(hasta, [...rows, a]);
        }
      }
      return { cliente, pendingTickets, pagosByVenta: byVenta, saldoPendiente };
    },
  });
}
