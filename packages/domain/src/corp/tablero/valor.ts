import type { Money } from '../../money/index.js';
import type { Tarjeta } from './tipos.js';

/**
 * A deliverable's value (OD-4 §2): each partner proposes one and the average
 * is used; when they differ over 2× the card waits for a third party's quote,
 * whose amount becomes the value for both. A task has no value.
 */
export type FuenteValor = 'falta' | 'cotizacion_requerida' | 'promedio' | 'cotizacion';

export interface ValorDeTarjeta {
  readonly fuente: FuenteValor;
  /** Centavos; null until the card has one. */
  readonly valor: Money | null;
}

export function difierenMasDelDoble(a: Money, b: Money): boolean {
  const [menor, mayor] = a < b ? [a, b] : [b, a];
  return mayor > menor * 2n;
}

/** Half up, so an odd centavo goes to the deliverable. */
export const promedio = (a: Money, b: Money): Money => (a + b + 1n) / 2n;

export function valorDeTarjeta(
  t: Pick<Tarjeta, 'tipo' | 'valores' | 'cotizacion'>,
): ValorDeTarjeta {
  if (t.tipo === 'tarea') return { fuente: 'falta', valor: null };
  if (t.cotizacion !== null) return { fuente: 'cotizacion', valor: t.cotizacion };
  const a = t.valores[1];
  const b = t.valores[2];
  if (a === null || b === null) return { fuente: 'falta', valor: null };
  if (difierenMasDelDoble(a, b)) return { fuente: 'cotizacion_requerida', valor: null };
  return { fuente: 'promedio', valor: promedio(a, b) };
}

/** The card's value, or zero for one that has none yet. */
export const valorOCero = (t: Pick<Tarjeta, 'tipo' | 'valores' | 'cotizacion'>): Money =>
  valorDeTarjeta(t).valor ?? 0n;
