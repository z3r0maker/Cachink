import { formatMoneyEntero } from '@xangarro/domain';
import type {
  EstadoResultados,
  MesDeTendencia,
  PuenteEbitda,
  RenglonId,
} from '@xangarro/domain/corp';
import { formatMonth } from '@xangarro/domain';

import { ETIQUETA, porcentaje } from './resultados-view';

/**
 * The geometry of Resultados' three charts (E-12, board CD-07): each bar as
 * percentages of its chart, so the page only draws. Colours are roles of the
 * `dataviz` tokens (ADR-133), never picked here.
 */
export type Rol =
  | 'ingreso'
  | 'restante'
  | 'perdida'
  | 'impuesto'
  | 'costoServicio'
  | 'ventasMarketing'
  | 'desarrollo'
  | 'administracion';

export interface Barra {
  readonly label: string;
  readonly valor: string;
  readonly nota: string;
  /** Percent of the chart from its bottom, and the bar's height. */
  readonly desde: number;
  readonly alto: number;
  readonly rol: Rol;
  readonly total: boolean;
}

const PASOS: readonly (readonly [RenglonId, Rol, boolean])[] = [
  ['ingresos', 'ingreso', true],
  ['costo_servicio', 'costoServicio', false],
  ['utilidad_bruta', 'restante', true],
  ['ventas_marketing', 'ventasMarketing', false],
  ['desarrollo', 'desarrollo', false],
  ['administracion', 'administracion', false],
  ['ebitda', 'restante', true],
  ['depreciacion', 'impuesto', false],
  ['financiero', 'impuesto', false],
  ['isr_estimado', 'impuesto', false],
  ['utilidad_neta', 'restante', true],
];

const CORTO: Partial<Record<RenglonId, string>> = {
  depreciacion: 'Depreciación',
  financiero: 'Financiero',
  isr_estimado: 'ISR estimado',
  ingresos: 'Ingresos',
};

/** Spans in value space mapped to percent of [min(0, …), max(0, …)]. */
function escala(spans: readonly (readonly [bigint, bigint])[]) {
  const vals = spans.flat();
  const lo = vals.reduce((a, v) => (v < a ? v : a), 0n);
  const hi = vals.reduce((a, v) => (v > a ? v : a), 0n);
  const rango = hi - lo === 0n ? 1n : hi - lo;
  return ([a, b]: readonly [bigint, bigint]) => {
    const [bajo, alto] = a < b ? [a, b] : [b, a];
    return {
      desde: Number(((bajo - lo) * 1000n) / rango) / 10,
      alto: Number(((alto - bajo) * 1000n) / rango) / 10,
    };
  };
}

/** «De $38,400 de ingresos a $9,041 de utilidad»: income down to net profit. */
export function cascada(e: EstadoResultados): Barra[] {
  const r = e.renglones;
  let nivel = 0n;
  const spans = PASOS.map(([id, , total]): readonly [bigint, bigint] => {
    if (total) {
      nivel = r[id];
      return [0n, r[id]];
    }
    const antes = nivel;
    nivel += r[id];
    return [antes, nivel];
  });
  const a = escala(spans);
  const ingresos = r.ingresos;
  return PASOS.map(([id, rol, total], i) => ({
    label: CORTO[id] ?? ETIQUETA[id],
    valor: formatMoneyEntero(r[id]).replace('-', '−'),
    nota:
      ingresos > 0n
        ? porcentaje(Number(((r[id] < 0n ? -r[id] : r[id]) * 10_000n) / ingresos))
        : 'Sin datos',
    ...a(spans[i]!),
    rol,
    total,
  }));
}

export interface PasoPuente extends Omit<Barra, 'nota' | 'total'> {
  readonly total: boolean;
}

const ROL_PASO = (v: bigint): Rol => (v > 0n ? 'ingreso' : 'perdida');

/** «¿Por qué cambió el EBITDA?»: the previous EBITDA, what moved, this one. */
export function puente(p: PuenteEbitda, antes: string, ahora: string): PasoPuente[] {
  let nivel = p.inicio;
  const filas: { label: string; span: readonly [bigint, bigint]; v: bigint; total: boolean }[] = [
    { label: `EBITDA ${antes}`, span: [0n, p.inicio], v: p.inicio, total: true },
  ];
  for (const s of p.pasos) {
    filas.push({
      label: ETIQUETA[s.id],
      span: [nivel, nivel + s.importe],
      v: s.importe,
      total: false,
    });
    nivel += s.importe;
  }
  filas.push({ label: `EBITDA ${ahora}`, span: [0n, p.fin], v: p.fin, total: true });
  const a = escala(filas.map((f) => f.span));
  return filas.map((f) => ({
    label: f.label,
    valor: f.total
      ? formatMoneyEntero(f.v).replace('-', '−')
      : `${f.v > 0n ? '+' : '−'}${formatMoneyEntero(f.v < 0n ? -f.v : f.v)}`,
    ...a(f.span),
    rol: f.total ? 'restante' : ROL_PASO(f.v),
    total: f.total,
  }));
}

export interface MesGrafica {
  readonly label: string;
  readonly margen: string;
  readonly ingresos: number;
  readonly costos: readonly { readonly rol: Rol; readonly alto: number }[];
}

const COSTOS: readonly (readonly [keyof MesDeTendencia['costos'], Rol])[] = [
  ['costo_servicio', 'costoServicio'],
  ['ventas_marketing', 'ventasMarketing'],
  ['desarrollo', 'desarrollo'],
  ['administracion', 'administracion'],
];

/** «Ingresos contra costos, 6 meses»: income beside its stacked costs, in percent of the tallest. */
export function tendenciaGrafica(meses: readonly MesDeTendencia[]): MesGrafica[] {
  const total = (m: MesDeTendencia) => COSTOS.reduce((s, [k]) => s + m.costos[k], 0n);
  const tope = meses.reduce(
    (t, m) => [m.ingresos, total(m), t].reduce((a, b) => (b > a ? b : a)),
    1n,
  );
  const pct = (v: bigint) => Number(((v < 0n ? 0n : v) * 1000n) / tope) / 10;
  return meses.map((m) => ({
    label: (formatMonth(m.mes).split(' ')[0] ?? m.mes).slice(0, 3),
    margen: m.margenEbitda === null ? 'Sin datos' : `${Math.round(m.margenEbitda / 100)} %`,
    ingresos: pct(m.ingresos),
    costos: COSTOS.map(([k, rol]) => ({ rol, alto: pct(m.costos[k]) })),
  }));
}
