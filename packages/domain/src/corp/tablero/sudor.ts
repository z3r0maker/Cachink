import type { Money } from '../../money/index.js';
import { estadoDeTarjeta } from './estado.js';
import type { Tarjeta } from './tipos.js';
import { valorDeTarjeta } from './valor.js';

/**
 * «Costo de sudor» (E-12, board CD-07; owner decision 2026-11-20): the value
 * the Tablero accepted, as the partners' unpaid work, in the period its cards
 * were finished in, the Tablero's own rule for quarters. Work still in review
 * or objected does not count yet; tasks carry no value.
 */
export interface CostoDeSudor {
  /** Centavos. */
  readonly valor: Money;
  readonly tarjetas: number;
}

export function costoDeSudor(
  tarjetas: readonly Tarjeta[],
  periodo: { readonly desde: string; readonly hasta: string },
  hoy: string,
): CostoDeSudor {
  let valor = 0n;
  let n = 0;
  for (const t of tarjetas) {
    if (t.tipo !== 'entregable') continue;
    const e = estadoDeTarjeta(t, hoy);
    const fin = e.terminadaEl;
    if (e.fase !== 'aceptada' || fin === null || fin < periodo.desde || fin > periodo.hasta)
      continue;
    valor += valorDeTarjeta(t).valor ?? 0n;
    n += 1;
  }
  return { valor, tarjetas: n };
}
