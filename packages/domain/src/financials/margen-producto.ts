/**
 * Per-product gross margin calculation.
 *
 * Pure domain helper — no IO, no side effects. Returns the absolute
 * profit (in centavos) and the percentage margin relative to the
 * selling price. Bigint-safe per CLAUDE.md §2.
 *
 * Designed as the hook-point for future margin alerts (e.g.
 * "this product has a negative margin").
 */

import type { Money } from '../money/index.js';
import { ZERO, subtract } from '../money/index.js';

export interface MargenProducto {
  /** Profit per unit in centavos: precioVenta − costo. */
  readonly gananciaCentavos: Money;
  /**
   * Margin as a percentage of the selling price:
   * `(precioVenta − costo) / precioVenta × 100`.
   *
   * Rounded to 2 decimal places. Negative values are preserved (not
   * clamped) — that's exactly what future alerts need.
   */
  readonly margenPct: number;
}

/**
 * Compute the gross margin for a single product.
 *
 * @returns `null` when `precioVenta` is ≤ 0 (nothing meaningful to
 *          show — the product is free or has no price yet).
 */
export function calcularMargenProducto(
  costo: Money,
  precioVenta: Money,
): MargenProducto | null {
  if (precioVenta <= ZERO) return null;

  const ganancia = subtract(precioVenta, costo);

  // Bigint-safe percentage: (ganancia * 10000) / precioVenta gives
  // basis points, then divide by 100 to get a 2-decimal percentage.
  const basisPoints = (ganancia * 10000n) / precioVenta;
  const margenPct = Number(basisPoints) / 100;

  return { gananciaCentavos: ganancia, margenPct };
}
