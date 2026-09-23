/**
 * The chart geometry that carries a rule worth testing (C-13).
 *
 * Pure, and in a `.ts` beside `charts-data.ts` rather than inside the `.tsx`
 * drawings, for the same reason that file is: a unit test can import it
 * without a stylesheet plugin, and the rules here are the ones a wrong chart
 * would break silently — a bar scaled against its own side, or a band that
 * disagrees with the verdict printed under it.
 */

import type { FlujoDeEfectivo, Money } from '@xangarro/domain';

export interface FilaFlujo {
  readonly label: string;
  readonly monto: Money;
  readonly entrada: boolean;
}

export function filasDeFlujo(f: FlujoDeEfectivo): readonly FilaFlujo[] {
  return [
    { label: 'Cobros de ventas de contado', monto: f.cobroVentasContado, entrada: true },
    { label: 'Cobros de crédito a clientes', monto: f.cobroCreditoClientes, entrada: true },
    { label: 'Gastos operativos', monto: f.egresoOperativo, entrada: false },
    { label: 'Compras de inventario', monto: f.egresoInversion, entrada: false },
  ];
}

/** The axis sits here on the 700-wide canvas; these bound the two runways. */
export const EJE = 330;
/** The category labels end at 186, so a salida may not run past this. */
export const IZQ_MIN = 196;
/** An entrada's amount is printed outside its right edge; leave it room. */
export const DER_MAX = 626;

/**
 * One scale for both sides, or the chart lies: a salida drawn on its own
 * scale would look bigger than a larger entrada. The shorter runway wins, so
 * whichever side runs out of room first sets the scale for both.
 *
 * Returns pixels per centavo. Zero when there is nothing to draw.
 */
export function escalaDeFlujo(filas: readonly FilaFlujo[]): number {
  const mayor = (entrada: boolean) =>
    Math.max(0, ...filas.filter((f) => f.entrada === entrada).map((f) => Number(f.monto)));
  const entradas = mayor(true);
  const salidas = mayor(false);
  const porDerecha = entradas === 0 ? Infinity : (DER_MAX - EJE) / entradas;
  const porIzquierda = salidas === 0 ? Infinity : (EJE - IZQ_MIN) / salidas;
  const s = Math.min(porDerecha, porIzquierda);
  return Number.isFinite(s) ? s : 0;
}

/** π × 70 — the gauge semicircle's length, as the design writes it out. */
export const ARCO_LARGO = 219.9;
const CX = 90;
const CY = 90;

/** Where the needle points: 0 → hard left, 1 → hard right, clamped. */
export function puntaDeAguja(frac: number): { readonly x: number; readonly y: number } {
  const a = ((180 - 180 * Math.min(1, Math.max(0, frac))) * Math.PI) / 180;
  return { x: CX + 62 * Math.cos(a), y: CY - 62 * Math.sin(a) };
}

/**
 * The three bands as dash patterns over one arc: red runs to `lo`, amber from
 * `lo` to `hi`, green from `hi` to the end. The leading `0 n` is the gap that
 * skips what the band before it already painted, so the three can never
 * disagree about where a boundary is.
 */
export function bandasDeGauge(
  lo: number,
  hi: number,
  max: number,
): readonly { readonly banda: 'critical' | 'warning' | 'healthy'; readonly dash: string }[] {
  const a = (lo / max) * ARCO_LARGO;
  const b = ((hi - lo) / max) * ARCO_LARGO;
  return [
    { banda: 'critical', dash: `${a.toFixed(1)} 400` },
    { banda: 'warning', dash: `0 ${a.toFixed(1)} ${b.toFixed(1)} 400` },
    {
      banda: 'healthy',
      dash: `0 ${(a + b).toFixed(1)} ${(ARCO_LARGO - a - b).toFixed(1)} 400`,
    },
  ];
}
