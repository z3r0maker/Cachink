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
import type { Client, Money, Sale } from '@cachink/domain';
import { useClientsRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface CuentaPorCobrar {
  readonly cliente: Client;
  readonly ventas: readonly Sale[];
  readonly total: Money;
}

function sumAmounts(ventas: readonly Sale[]): Money {
  let total = 0n as Money;
  for (const venta of ventas) {
    total = ((total as bigint) + (venta.monto as bigint)) as Money;
  }
  return total;
}

export function useCuentasPorCobrar(): UseQueryResult<readonly CuentaPorCobrar[], Error> {
  const clients = useClientsRepository();
  const sales = useSalesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly CuentaPorCobrar[], Error>({
    queryKey: ['cuentasPorCobrar', businessId],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      const allClients = await clients.findByName('', businessId);
      const rows: CuentaPorCobrar[] = [];
      for (const cliente of allClients) {
        const pending = await sales.findPendingByClient(cliente.id);
        if (pending.length === 0) continue;
        rows.push({ cliente, ventas: pending, total: sumAmounts(pending) });
      }
      return rows;
    },
  });
}
