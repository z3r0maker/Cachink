import { pesosToCentavos } from '@xangarro/domain';

/** The parser lives in the domain (one copy); re-exported for the portal's forms. */
export { pesosToCentavos };

/**
 * Margin on the sale price, in whole percent; `null` until both amounts parse.
 * Integer division: a margin never rounds up to one it did not earn.
 */
export function marginPercent(costo: string, precio: string): number | null {
  const c = pesosToCentavos(costo);
  const p = pesosToCentavos(precio);
  if (c === null || p === null || p === 0n) return null;
  return Number(((p - c) * 100n) / p);
}
