/**
 * `useMermaReportes` — TanStack query that fetches inventory movements
 * where motivo includes 'Merma', groups by productoId, and sums
 * quantities lost per product.
 *
 * Powers the Merma Reportes screen (Part C1).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { InventoryMovement, IsoDate, ProductId } from '@cachink/domain';
import { useInventoryMovementsRepository, useProductsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { mermaKeys } from './query-keys';

export interface MermaReporteRow {
  readonly productoId: ProductId;
  readonly productoNombre: string;
  readonly totalUnidades: number;
  readonly movimientos: readonly InventoryMovement[];
}

function groupByProducto(
  movements: readonly InventoryMovement[],
  nameMap: ReadonlyMap<string, string>,
): readonly MermaReporteRow[] {
  const map = new Map<
    string,
    { productoId: ProductId; totalUnidades: number; movimientos: InventoryMovement[] }
  >();

  for (const m of movements) {
    const existing = map.get(m.productoId as string);
    if (existing) {
      existing.totalUnidades += m.cantidad;
      existing.movimientos.push(m);
    } else {
      map.set(m.productoId as string, {
        productoId: m.productoId,
        totalUnidades: m.cantidad,
        movimientos: [m],
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.totalUnidades - a.totalUnidades)
    .map((row) => ({
      ...row,
      productoNombre: nameMap.get(row.productoId as string) ?? '(Producto eliminado)',
    }));
}

interface MermaQueryResult {
  readonly movements: readonly InventoryMovement[];
  readonly nameMap: ReadonlyMap<string, string>;
}

export function useMermaReportes(
  from: IsoDate,
  to: IsoDate,
): {
  readonly data: readonly MermaReporteRow[] | undefined;
  readonly isLoading: boolean;
  readonly error: Error | null;
} {
  const movementsRepo = useInventoryMovementsRepository();
  const productsRepo = useProductsRepository();
  const businessId = useCurrentBusinessId();

  const query = useQuery<MermaQueryResult, Error>({
    queryKey: mermaKeys.byRange(businessId, from, to),
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return { movements: [], nameMap: new Map() };
      const [all, products] = await Promise.all([
        movementsRepo.findByDateRange(from, to, businessId),
        productsRepo.listForBusiness(businessId),
      ]);
      const nameMap = new Map(products.map((p) => [p.id as string, p.nombre]));
      const movements = all.filter((m) => m.motivo.includes('Merma'));
      return { movements, nameMap };
    },
  });

  const grouped = useMemo(
    () =>
      query.data
        ? groupByProducto(query.data.movements, query.data.nameMap)
        : undefined,
    [query.data],
  );

  return {
    data: grouped,
    isLoading: query.isLoading,
    error: query.error,
  };
}
