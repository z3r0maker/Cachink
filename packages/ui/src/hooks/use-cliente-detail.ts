/**
 * `useClienteDetail` — TanStack query that resolves everything
 * needed for ClienteDetailScreen: the cliente row, pending ventas,
 * and all pagos grouped by venta.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Client, ClientId, ClientPayment, Money, Sale } from '@cachink/domain';
import { ZERO } from '@cachink/domain';
import {
  useClientPaymentsRepository,
  useClientsRepository,
  useSalesRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface ClienteDetailData {
  readonly cliente: Client;
  readonly pendingSales: readonly Sale[];
  readonly pagosByVenta: ReadonlyMap<string, readonly ClientPayment[]>;
  readonly saldoPendiente: Money;
}

export function useClienteDetail(
  id: ClientId | null,
): UseQueryResult<ClienteDetailData | null, Error> {
  const clients = useClientsRepository();
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
      const pendingSales = await sales.findPendingByClient(id);
      const byVenta = new Map<string, readonly ClientPayment[]>();
      let saldoPendiente = ZERO;
      for (const venta of pendingSales) {
        const rows = await pagos.findByVenta(venta.id);
        byVenta.set(venta.id, rows);
        const paid = rows.reduce((acc, p) => acc + (p.montoCentavos as bigint), 0n);
        saldoPendiente = ((saldoPendiente as bigint) + (venta.monto as bigint) - paid) as Money;
      }
      return { cliente, pendingSales, pagosByVenta: byVenta, saldoPendiente };
    },
  });
}
