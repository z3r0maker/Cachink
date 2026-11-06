import type { Money } from '../../money/index.js';
import { MontoInvalidoError } from '../ledger/errors.js';
import {
  estadoDeResultados,
  type Base,
  type EstadoResultados,
  type ImporteResultados,
} from './cascada.js';
import { mesesHasta, parsePeriodo } from './periodo.js';

/**
 * «¿Por qué cambió el EBITDA?» and «Ingresos contra costos, 6 meses»
 * (E-12, board CD-07), both read off `estadoDeResultados`.
 */
const LINEAS_EBITDA = [
  'ingresos',
  'costo_servicio',
  'ventas_marketing',
  'desarrollo',
  'administracion',
] as const;

export type LineaEbitda = (typeof LINEAS_EBITDA)[number];

export interface PuenteEbitda {
  readonly inicio: Money;
  /** Each line that moved, by its effect on EBITDA. */
  readonly pasos: readonly { readonly id: LineaEbitda; readonly importe: Money }[];
  readonly fin: Money;
}

export function puenteEbitda(actual: EstadoResultados, anterior: EstadoResultados): PuenteEbitda {
  const pasos = LINEAS_EBITDA.map((id) => ({
    id,
    importe: actual.renglones[id] - anterior.renglones[id],
  })).filter((p) => p.importe !== 0n);
  return { inicio: anterior.renglones.ebitda, pasos, fin: actual.renglones.ebitda };
}

export interface MesDeTendencia {
  readonly mes: string;
  readonly ingresos: Money;
  /** Each cost category as a positive amount. */
  readonly costos: Readonly<Record<Exclude<LineaEbitda, 'ingresos'>, Money>>;
  readonly margenEbitda: number | null;
}

export function tendencia(
  importes: readonly ImporteResultados[],
  ultimo: string,
  meses: number,
  base: Base,
): MesDeTendencia[] {
  if (!Number.isInteger(meses) || meses < 1) {
    throw new MontoInvalidoError('la tendencia necesita al menos un mes');
  }
  return mesesHasta(ultimo, meses).map((mes) => {
    const e = estadoDeResultados(importes, parsePeriodo(mes)!, base);
    const r = e.renglones;
    return {
      mes,
      ingresos: r.ingresos,
      costos: {
        costo_servicio: -r.costo_servicio,
        ventas_marketing: -r.ventas_marketing,
        desarrollo: -r.desarrollo,
        administracion: -r.administracion,
      },
      margenEbitda: e.margenEbitda,
    };
  });
}
