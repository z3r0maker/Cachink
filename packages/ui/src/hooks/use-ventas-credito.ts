/**
 * `useVentasCredito` — TanStack query for credit sales that are NOT
 * fully paid. Groups by clienteId and sums pending totals.
 *
 * Reuses the existing `Sale` entity and `SalesRepository`. Filters
 * where `metodo='Crédito'` AND `estadoPago != 'pagado'`.
 *
 * Powers the Ventas a Crédito screen (Part C3).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BusinessId, ClientId, IsoDate, Ticket } from '@xangarro/domain';
import { useClientsRepository, useSalesRepository, useTicketsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { ventasCreditoKeys } from './query-keys';

export interface CreditSaleRow {
  readonly clienteId: ClientId | null;
  readonly clienteNombre: string;
  readonly totalPendienteCentavos: bigint;
  readonly ventas: readonly Ticket[];
}

function groupByCliente(
  sales: readonly Ticket[],
  montos: ReadonlyMap<string, bigint>,
  nameMap: ReadonlyMap<string, string>,
): readonly CreditSaleRow[] {
  const map = new Map<
    string,
    { clienteId: ClientId | null; totalPendienteCentavos: bigint; ventas: Ticket[] }
  >();

  for (const s of sales) {
    const key = (s.clienteId as string) ?? '__sin-cliente__';
    const existing = map.get(key);
    if (existing) {
      existing.totalPendienteCentavos += montos.get(s.id) ?? 0n;
      existing.ventas.push(s);
    } else {
      map.set(key, {
        clienteId: s.clienteId ?? null,
        totalPendienteCentavos: montos.get(s.id) ?? 0n,
        ventas: [s],
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => {
      if (a.totalPendienteCentavos > b.totalPendienteCentavos) return -1;
      if (a.totalPendienteCentavos < b.totalPendienteCentavos) return 1;
      return 0;
    })
    .map((row) => ({
      ...row,
      clienteNombre:
        row.clienteId !== null
          ? (nameMap.get(row.clienteId as string) ?? '(Cliente eliminado)')
          : 'Sin cliente',
    }));
}

interface CreditQueryResult {
  readonly sales: readonly Ticket[];
  /** Each ticket's lines' total (ADR-073) — derived, never stored. */
  readonly montos: ReadonlyMap<string, bigint>;
  readonly nameMap: ReadonlyMap<string, string>;
}

async function fetchCreditSales(
  from: IsoDate,
  to: IsoDate,
  businessId: BusinessId,
  ticketsRepo: ReturnType<typeof useTicketsRepository>,
  salesRepo: ReturnType<typeof useSalesRepository>,
  clientsRepo: ReturnType<typeof useClientsRepository>,
): Promise<CreditQueryResult> {
  const [allTickets, allLines, clients] = await Promise.all([
    ticketsRepo.findByDateRange(from, to, businessId),
    salesRepo.findByDateRange(from, to, businessId),
    clientsRepo.findByName('', businessId),
  ]);
  const nameMap = new Map<string, string>(clients.map((c) => [c.id as string, c.nombre]));
  const montos = new Map<string, bigint>();
  for (const line of allLines) {
    montos.set(line.ticketId, (montos.get(line.ticketId) ?? 0n) + line.monto);
  }
  const sales = allTickets.filter((s) => s.metodo === 'Crédito' && s.estadoPago !== 'pagado');
  return { sales, montos, nameMap };
}

export function useVentasCredito(
  from: IsoDate,
  to: IsoDate,
): {
  readonly data: readonly CreditSaleRow[] | undefined;
  readonly isLoading: boolean;
  readonly error: Error | null;
} {
  const ticketsRepo = useTicketsRepository();
  const salesRepo = useSalesRepository();
  const clientsRepo = useClientsRepository();
  const businessId = useCurrentBusinessId();

  const query = useQuery<CreditQueryResult, Error>({
    queryKey: ventasCreditoKeys.byRange(businessId, from, to),
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) {
        return { sales: [], montos: new Map(), nameMap: new Map<string, string>() };
      }
      return fetchCreditSales(from, to, businessId, ticketsRepo, salesRepo, clientsRepo);
    },
  });

  const grouped = useMemo(
    () =>
      query.data
        ? groupByCliente(query.data.sales, query.data.montos, query.data.nameMap)
        : undefined,
    [query.data],
  );

  return { data: grouped, isLoading: query.isLoading, error: query.error };
}
