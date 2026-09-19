/**
 * `useCuentasPorCobrar` — TanStack query combining the list of
 * business clients with their pending Crédito sales.
 *
 * Returns a flat array of rows, one per cliente that has at least one
 * pending/parcial sale, containing the client + the sum of pending
 * amounts. Empty when no credit is outstanding.
 *
 * The strategy is naïve-but-bounded — O(N clients) repository calls.
 * Phase 1C-M6 will add a dedicated `findPendingByBusiness` method
 * once we have a real-user-scale load to measure against.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Client, Money, Ticket } from '@xangarro/domain';
import { useClientsRepository, useSalesRepository, useTicketsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface CuentaPorCobrar {
  readonly cliente: Client;
  /** Open fiado tickets of this client (ADR-073). */
  readonly ventas: readonly Ticket[];
  readonly total: Money;
}

/** A ticket's balance is its lines' sum — derived, never stored (ADR-073). */
function sumAmounts(ventas: readonly Ticket[], montos: ReadonlyMap<string, Money>): Money {
  let total = 0n as Money;
  for (const venta of ventas) {
    total = ((total as bigint) + (montos.get(venta.id) ?? 0n)) as Money;
  }
  return total;
}

export function useCuentasPorCobrar(): UseQueryResult<readonly CuentaPorCobrar[], Error> {
  const clients = useClientsRepository();
  const tickets = useTicketsRepository();
  const sales = useSalesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly CuentaPorCobrar[], Error>({
    queryKey: ['cuentasPorCobrar', businessId],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      const [allClients, allLines] = await Promise.all([
        clients.findByName('', businessId),
        sales.findByDateRange('0000-01-01', '9999-12-31', businessId),
      ]);
      const montos = new Map<string, Money>();
      for (const line of allLines) {
        montos.set(line.ticketId, ((montos.get(line.ticketId) ?? 0n) + line.monto) as Money);
      }
      const rows: CuentaPorCobrar[] = [];
      for (const cliente of allClients) {
        const pending = await tickets.findPendingByClient(cliente.id);
        if (pending.length === 0) continue;
        rows.push({ cliente, ventas: pending, total: sumAmounts(pending, montos) });
      }
      return rows;
    },
  });
}
