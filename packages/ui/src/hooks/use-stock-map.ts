/**
 * `useStockMap` — derives a `Map<ProductId, stock>` from the
 * `useProductosConStock()` query result.
 *
 * Promoted from per-route helpers to eliminate duplication
 * (CLAUDE.md §2 #3 — "Code lives in exactly one place").
 */
import { useMemo } from 'react';

export function useStockMap(
  stockQ: { data?: readonly { producto: { id: string }; stock: number }[] },
): Map<string, number> {
  return useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stockQ.data ?? []) map.set(row.producto.id, row.stock);
    return map;
  }, [stockQ.data]);
}
