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
import type { ClientId, IsoDate, Sale } from '@cachink/domain';
import { useClientsRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { ventasCreditoKeys } from './query-keys';

export interface CreditSaleRow {
  readonly clienteId: ClientId | null;
  readonly clienteNombre: string;
  readonly totalPendienteCentavos: bigint;
  readonly ventas: readonly Sale[];
}

function groupByCliente(
  sales: readonly Sale[],
  nameMap: ReadonlyMap<string, string>,
): readonly CreditSaleRow[] {
  const map = new Map<
    string,
    { clienteId: ClientId | null; totalPendienteCentavos: bigint; ventas: Sale[] }
  >();

  for (const s of sales) {
    const key = (s.clienteId as string) ?? '__sin-cliente__';
    const existing = map.get(key);
    if (existing) {
      existing.totalPendienteCentavos += s.monto;
      existing.ventas.push(s);
    } else {
      map.set(key, {
        clienteId: s.clienteId ?? null,
        totalPendienteCentavos: s.monto,
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
  readonly sales: readonly Sale[];
  readonly nameMap: ReadonlyMap<string, string>;
}

export function useVentasCredito(
  from: IsoDate,
  to: IsoDate,
): {
  readonly data: readonly CreditSaleRow[] | undefined;
  readonly isLoading: boolean;
  readonly error: Error | null;
} {
  const salesRepo = useSalesRepository();
  const clientsRepo = useClientsRepository();
  const businessId = useCurrentBusinessId();

  const query = useQuery<CreditQueryResult, Error>({
    queryKey: ventasCreditoKeys.byRange(businessId, from, to),
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) {
        return { sales: [] as readonly Sale[], nameMap: new Map<string, string>() };
      }
      const [all, clients] = await Promise.all([
        salesRepo.findByDateRange(from, to, businessId),
        clientsRepo.findByName('', businessId),
      ]);
      const nameMap = new Map<string, string>(
        clients.map((c) => [c.id as string, c.nombre]),
      );
      const sales = all.filter(
        (s) => s.metodo === 'Crédito' && s.estadoPago !== 'pagado',
      );
      return { sales, nameMap };
    },
  });

  const grouped = useMemo(
    () =>
      query.data
        ? groupByCliente(query.data.sales, query.data.nameMap)
        : undefined,
    [query.data],
  );

  return {
    data: grouped,
    isLoading: query.isLoading,
    error: query.error,
  };
}
