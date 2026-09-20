/**
 * `useStockMap` — derives a `Map<ProductId, stock>` from the
 * `useProductosConStock()` query result.
 *
 * Promoted from per-route helpers to eliminate duplication
 * (CLAUDE.md §2 #3 — "Code lives in exactly one place").
 *
 * Empty when the effective `stock` flag is off (A-14), and products that do
 * not track stock are left out — so product cards and the cart show no stock
 * without each screen checking the plan.
 */
import { useMemo } from 'react';
import { useFeatureFlag } from './use-feature-flags';

export function useStockMap(stockQ: {
  data?: readonly { producto: { id: string; seguirStock?: boolean }; stock: number }[];
}): Map<string, number> {
  const stockOn = useFeatureFlag('stock');
  return useMemo(() => {
    const map = new Map<string, number>();
    if (!stockOn) return map;
    for (const row of stockQ.data ?? []) {
      if (row.producto.seguirStock !== false) map.set(row.producto.id, row.stock);
    }
    return map;
  }, [stockQ.data, stockOn]);
}
