import type { Producto } from './parts';

/**
 * The Catálogo's two computed numbers (B-5, B-6), kept pure and in a `.ts`
 * so a unit test can reach them: both are arithmetic a wrong sign or a bad
 * denominator would spoil silently, on a screen the owner reads for money.
 */

/**
 * «Margen promedio» over the catalogue, **weighted by price** rather than
 * averaged per product: a $600 combo should count for more than a $12
 * refresco. A product with no price has no margin to contribute and stays
 * out of both halves of the ratio. Returns a fraction, or null when nothing
 * is priced.
 */
export function margenPromedio(rows: readonly Producto[]): number | null {
  const conPrecio = rows.filter((p) => p.precio > 0n);
  if (conPrecio.length === 0) return null;
  const ingreso = conPrecio.reduce((t, p) => t + p.precio, 0n);
  if (ingreso === 0n) return null;
  const costo = conPrecio.reduce((t, p) => t + p.costo, 0n);
  return Number(ingreso - costo) / Number(ingreso);
}

/**
 * How full the 12px bar draws, 0–100.
 *
 * The scale is twice the product's own threshold, so the threshold sits at
 * the halfway mark and «below it» reads as «less than half full» without
 * anyone having to compare two numbers. A product whose threshold is zero
 * has nothing to be below, so it draws full.
 */
export function llenadoStock(stock: number, umbral: number): number {
  const tope = Math.max(umbral * 2, 1);
  return Math.max(0, Math.min(100, (stock / tope) * 100));
}
