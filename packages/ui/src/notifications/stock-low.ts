/**
 * Stock-low notification predicate (A-13) — whether tonight's 19:00 reminder
 * should be scheduled on this device, and for how many products.
 *
 * Unconditional per device (no Director anymore): it only needs the device's
 * notifications toggle on, stock on for the plan, and at least one product
 * that tracks stock at or below its threshold.
 */

export interface StockRow {
  readonly producto: { readonly seguirStock?: boolean; readonly umbralStockBajo: number };
  readonly stock: number;
}

export function stockLowCount(
  rows: readonly StockRow[],
  opts: { readonly notificationsEnabled: boolean; readonly stockEnabled: boolean },
): number {
  if (!opts.notificationsEnabled || !opts.stockEnabled) return 0;
  return rows.filter(
    (r) => r.producto.seguirStock !== false && r.stock <= r.producto.umbralStockBajo,
  ).length;
}
