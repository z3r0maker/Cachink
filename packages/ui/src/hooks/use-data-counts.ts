/**
 * `useDataCounts` — aggregates the three row counts the wizard's
 * data-preserved callout shows on a re-run (ADR-039).
 *
 * Returns `{ ventas, productos, clientes, hasAny }`. When the device
 * has no current business yet (first run), all values are 0 and
 * `hasAny === false` so the callout renders nothing.
 */

import { useQuery } from '@tanstack/react-query';
import { useCurrentBusinessId } from '../app-config/index';
import {
  useClientsRepository,
  useProductsRepository,
  useSalesRepository,
} from '../app/repository-provider';

export interface DataCounts {
  readonly ventas: number;
  readonly productos: number;
  readonly clientes: number;
  readonly hasAny: boolean;
}

export interface UseDataCountsResult {
  readonly counts: DataCounts;
  readonly loading: boolean;
}

const ZERO: DataCounts = { ventas: 0, productos: 0, clientes: 0, hasAny: false };

export function useDataCounts(): UseDataCountsResult {
  const businessId = useCurrentBusinessId();
  const sales = useSalesRepository();
  const products = useProductsRepository();
  const clients = useClientsRepository();
  const enabled = businessId !== null;
  const query = useQuery<DataCounts>({
    queryKey: ['wizard-data-counts', businessId],
    enabled,
    queryFn: async () => {
      if (!businessId) return ZERO;
      const [ventas, productos, clientes] = await Promise.all([
        sales.count(businessId),
        products.count(businessId),
        clients.count(businessId),
      ]);
      return {
        ventas,
        productos,
        clientes,
        hasAny: ventas + productos + clientes > 0,
      };
    },
  });
  return {
    counts: query.data ?? ZERO,
    loading: enabled && query.isLoading,
  };
}
