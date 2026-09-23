/**
 * The chart shapes for P-14's waterfall and donuts — pure, so a unit test can
 * hold them to the same NIF identities `tests/estados.test.ts` pins for the
 * statement lines.
 *
 * Money stays `bigint` centavos here: a step is the span it covers, `desde` →
 * `hasta`, and the drawing decides pixels. The earlier shape was Recharts'
 * stacked `base`/`delta` in floats, which the hand-drawn SVG has no use for
 * (C-13).
 */

import type { Desglose } from '@xangarro/domain';
import type { EstadoDeResultados } from '@xangarro/domain';
import type { Money } from '@xangarro/domain';

/**
 * One bar of the waterfall, as the span it covers on the value axis.
 *
 * A `total` runs from zero to the running result; a `resta` hangs between the
 * level it starts at and the level it leaves behind. Both are drawn the same
 * way — top and bottom, whichever is which — so a negative utilidad needs no
 * special case.
 */
export interface WaterfallStep {
  readonly label: string;
  /** The step's own amount, for the label above the bar. */
  readonly monto: Money;
  readonly desde: Money;
  readonly hasta: Money;
  /** `total` bars are anchored to zero; `resta` bars float. */
  readonly kind: 'total' | 'resta';
  /** The running result after this step. For a total, `hasta`. */
  readonly acumulado: Money;
}

export function waterfallDeResultados(er: EstadoDeResultados): readonly WaterfallStep[] {
  const pasos: readonly (readonly [string, Money, 'total' | 'resta'])[] = [
    ['Ingresos', er.ingresos, 'total'],
    ['Costo de ventas', er.costoDeVentas, 'resta'],
    ['Utilidad bruta', er.utilidadBruta, 'total'],
    ['Merma', er.merma, 'resta'],
    ['Gastos operativos', er.gastosOperativos, 'resta'],
    ['Utilidad operativa', er.utilidadOperativa, 'total'],
    ['ISR', er.isr, 'resta'],
    ['Utilidad neta', er.utilidadNeta, 'total'],
  ];

  const steps: WaterfallStep[] = [];
  let techo = 0n; // the top of the running column, in centavos
  for (const [label, monto, kind] of pasos) {
    if (monto === 0n) continue;
    if (kind === 'total') {
      steps.push({ label, monto, desde: 0n, hasta: monto, kind, acumulado: monto });
      techo = monto;
    } else {
      // The drop hangs from the level it starts at down to the new one.
      steps.push({
        label,
        monto,
        desde: techo,
        hasta: techo - monto,
        kind,
        acumulado: techo - monto,
      });
      techo -= monto;
    }
  }
  return steps;
}

/**
 * One slice of a donut, biggest first. The colour is the drawing's business:
 * the design gives each donut its own four-colour run, so a slice carries no
 * palette of its own.
 */
export interface DonutSlice {
  readonly label: string;
  readonly monto: Money;
}

function donutDePartidas(partidas: readonly { clave: string; monto: Money }[]): DonutSlice[] {
  return [...partidas]
    .filter((p) => p.monto > 0n)
    .sort((a, b) => Number(b.monto - a.monto))
    .map((p) => ({ label: p.clave, monto: p.monto }));
}

/** «De dónde vino el dinero» — ingresos by payment method. */
export function donutIngresos(desglose: Desglose): readonly DonutSlice[] {
  return donutDePartidas(desglose.ingresos);
}

/** «A dónde se fue» — every egreso category, costo de ventas and operativo alike. */
export function donutEgresos(desglose: Desglose): readonly DonutSlice[] {
  return donutDePartidas([...desglose.costoDeVentas, ...desglose.gastosOperativos]);
}
