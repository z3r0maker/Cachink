/**
 * `useInventarioKpis` — derives three Inventario KPIs from the
 * ProductoConStock list:
 *   - totalProductos: count of non-deleted productos.
 *   - valorInventario: sum of stock × costoUnitCentavos across all.
 *   - bajoStockCount: number of productos with stock <= umbralStockBajo.
 *
 * Exported `computeKpis` is pure and easy to unit-test without mounting
 * the query.
 */

import { useMemo } from 'react';
import type { Money } from '@cachink/domain';
import type { ProductoConStock } from './use-productos-con-stock';

export interface InventarioKpis {
  readonly totalProductos: number;
  readonly valorInventario: Money;
  readonly bajoStockCount: number;
}

export function computeKpis(items: readonly ProductoConStock[]): InventarioKpis {
  let valor = 0n as Money;
  let bajoStockCount = 0;
  for (const row of items) {
    valor = ((valor as bigint) +
      (row.producto.costoUnitCentavos as bigint) * BigInt(row.stock)) as Money;
    if (row.stock <= row.producto.umbralStockBajo) bajoStockCount += 1;
  }
  return {
    totalProductos: items.length,
    valorInventario: valor,
    bajoStockCount,
  };
}

export function useInventarioKpis(items: readonly ProductoConStock[]): InventarioKpis {
  return useMemo(() => computeKpis(items), [items]);
}
