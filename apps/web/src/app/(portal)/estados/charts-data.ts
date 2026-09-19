/**
 * The chart shapes for P-14's waterfall and donuts — pure, so a unit test can
 * hold them to the same NIF identities `tests/estados.test.ts` pins for the
 * statement lines.
 *
 * **Provisional by design**: the Estados design file is not mirrored (O-23),
 * so these charts are built from the statement's own numbers, not from a
 * drawn spec. When the design lands, `design:compare` reconciles them.
 */

import type { Desglose } from '@xangarro/domain';
import type { EstadoDeResultados } from '@xangarro/domain';
import type { Money } from '@xangarro/domain';

/** One bar of the waterfall: a floating `delta` on top of an invisible `base`. */
export interface WaterfallStep {
  readonly label: string;
  readonly base: number;
  readonly delta: number;
  /** `total` bars are anchored to zero; `resta` bars float. */
  readonly kind: 'total' | 'resta';
  /** The running result after this step, for the label. */
  readonly acumulado: Money;
}

const num = (m: Money) => Number(m);

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
      steps.push({ label, base: 0, delta: num(monto), kind, acumulado: monto });
      techo = monto;
    } else {
      const desde = techo - monto;
      steps.push({
        label,
        base: num(desde < 0n ? 0n : desde),
        delta: num(monto),
        kind,
        acumulado: techo - monto,
      });
      techo -= monto;
    }
  }
  return steps;
}

/** One slice of a donut. `color` is a token name, resolved by the chart. */
export interface DonutSlice {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

const PALETTE = ['yellow', 'blue', 'green', 'purple', 'peach', 'cyan', 'red', 'gray'] as const;

function donutDePartidas(partidas: readonly { clave: string; monto: Money }[]): DonutSlice[] {
  return [...partidas]
    .filter((p) => p.monto > 0n)
    .sort((a, b) => Number(b.monto - a.monto))
    .map((p, i) => ({
      label: p.clave,
      value: Number(p.monto),
      color: PALETTE[i % PALETTE.length] as string,
    }));
}

/** «De dónde vino el dinero» — ingresos by payment method. */
export function donutIngresos(desglose: Desglose): readonly DonutSlice[] {
  return donutDePartidas(desglose.ingresos);
}

/** «A dónde se fue» — every egreso category, costo de ventas and operativo alike. */
export function donutEgresos(desglose: Desglose): readonly DonutSlice[] {
  return donutDePartidas([...desglose.costoDeVentas, ...desglose.gastosOperativos]);
}
