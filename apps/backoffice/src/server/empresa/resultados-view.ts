import { formatMoney, formatMonth } from '@xangarro/domain';
import {
  esCuentaResultados,
  parsePeriodo,
  periodoAnterior,
  periodoDe,
  type Base,
  type CuentaResultados,
  type EstadoResultados,
  type Periodo,
  type RenglonId,
  type TipoPeriodo,
} from '@xangarro/domain/corp';

/**
 * Resultados' view (E-12, board CD-07): what the URL asks for, the period's
 * names, and the statement's rows. Pure: the page reads, this shapes.
 */
export interface VistaResultados {
  readonly periodo: Periodo;
  readonly base: Base;
  /** The line whose movements are shown under it. */
  readonly abrir: CuentaResultados | null;
}

export function parseVista(
  q: { readonly periodo?: string; readonly base?: string; readonly abrir?: string },
  hoy: string,
): VistaResultados {
  return {
    periodo: parsePeriodo(q.periodo ?? '') ?? periodoDe('mes', hoy),
    base: q.base === 'flujo' ? 'flujo' : 'devengado',
    abrir: q.abrir !== undefined && esCuentaResultados(q.abrir) ? q.abrir : null,
  };
}

/** The URL of the screen with some of its choices changed. */
export function hrefResultados(v: VistaResultados, cambio: Partial<VistaResultados> = {}): string {
  const n = { ...v, ...cambio };
  const q = new URLSearchParams({ periodo: n.periodo.clave });
  if (n.base === 'flujo') q.set('base', 'flujo');
  if (n.abrir !== null) q.set('abrir', n.abrir);
  return `/empresa/resultados?${q.toString()}`;
}

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ROMANO = ['', '1.er', '2.º', '3.er', '4.º'] as const;

/** «Septiembre de 2026», «3.er trimestre de 2026», «2026». */
export function nombrePeriodo(p: Periodo): string {
  if (p.tipo === 'mes') return mayuscula(formatMonth(p.clave));
  if (p.tipo === 'trimestre')
    return `${ROMANO[Number(p.clave.slice(-1))]} trimestre de ${p.clave.slice(0, 4)}`;
  return p.clave;
}

/** A column header: «Septiembre», «T3 2026», «2026». */
export function columnaPeriodo(p: Periodo): string {
  if (p.tipo === 'mes') return mayuscula(formatMonth(p.clave).split(' ')[0] ?? p.clave);
  if (p.tipo === 'trimestre') return `${p.clave.slice(5)} ${p.clave.slice(0, 4)}`;
  return p.clave;
}

/** The kind of period a selector button switches to, holding the same last day. */
export const cambiarTipo = (p: Periodo, tipo: TipoPeriodo): Periodo => periodoDe(tipo, p.hasta);
export const vecinos = (p: Periodo) => ({
  anterior: periodoAnterior(p),
  siguiente: periodoDe(p.tipo, siguienteDia(p.hasta)),
});

function siguienteDia(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Money with negatives in parentheses (the shell's rule). */
export const monto = (v: bigint): string => (v < 0n ? `(${formatMoney(-v)})` : formatMoney(v));

/** «35.0 %» from basis points. */
export const porcentaje = (bps: number): string => `${(bps / 100).toFixed(1)} %`;

export type Tono = 'bien' | 'mal' | 'igual';

export interface FilaEstado {
  readonly id: RenglonId;
  readonly label: string;
  readonly subtotal: boolean;
  readonly actual: string;
  readonly negativo: boolean;
  readonly pct: string;
  readonly anterior: string;
  readonly cambio: string;
  readonly tono: Tono;
  /** The account behind the line, when it can open into its movements. */
  readonly cuenta: CuentaResultados | null;
}

const RENGLONES: readonly (readonly [RenglonId, string, boolean])[] = [
  ['ingresos', 'Ingresos netos (sin IVA)', false],
  ['costo_servicio', 'Costo del servicio', false],
  ['utilidad_bruta', 'Utilidad bruta', true],
  ['ventas_marketing', 'Ventas y marketing', false],
  ['desarrollo', 'Desarrollo', false],
  ['administracion', 'Administración', false],
  ['ebitda', 'EBITDA', true],
  ['depreciacion', 'Depreciación y amortización', false],
  ['utilidad_operacion', 'Utilidad de operación', true],
  ['financiero', 'Resultado financiero', false],
  ['utilidad_antes_impuestos', 'Utilidad antes de impuestos', true],
  ['isr_estimado', 'ISR estimado (RESICO persona moral)', false],
  ['utilidad_neta', 'Utilidad neta', true],
];

export const ETIQUETA: Readonly<Record<RenglonId, string>> = Object.fromEntries(
  RENGLONES.map(([id, label]) => [id, label]),
) as Record<RenglonId, string>;

function pctDe(id: RenglonId, e: EstadoResultados): string {
  const ingresos = e.renglones.ingresos;
  if (ingresos <= 0n) return 'Sin datos';
  if (id === 'utilidad_bruta')
    return e.margenBruto === null ? 'Sin datos' : porcentaje(e.margenBruto);
  if (id === 'ebitda') return e.margenEbitda === null ? 'Sin datos' : porcentaje(e.margenEbitda);
  const v = e.renglones[id];
  return porcentaje(Number(((v < 0n ? -v : v) * 10_000n) / ingresos));
}

function cambio(d: bigint): string {
  if (d === 0n) return '$0.00';
  return d > 0n ? `+${formatMoney(d)}` : `−${formatMoney(-d)}`;
}

/** Every line of §4's cascade, in the board's order, against the previous period. */
export function filasEstado(actual: EstadoResultados, anterior: EstadoResultados): FilaEstado[] {
  return RENGLONES.map(([id, label, subtotal]) => {
    const v = actual.renglones[id];
    const d = v - anterior.renglones[id];
    return {
      id,
      label,
      subtotal,
      actual: monto(v),
      negativo: v < 0n,
      pct: pctDe(id, actual),
      anterior: monto(anterior.renglones[id]),
      cambio: cambio(d),
      tono: d > 0n ? 'bien' : d < 0n ? 'mal' : 'igual',
      cuenta: esCuentaResultados(id) ? id : null,
    };
  });
}

export interface MovimientoDeLinea {
  readonly entryId: string;
  readonly fecha: string;
  readonly concepto: string;
  readonly monto: string;
}

/** The movements behind an opened line, oldest first, on the line's own sign. */
export function movimientosDe(e: EstadoResultados, cuenta: CuentaResultados): MovimientoDeLinea[] {
  const signo = cuenta === 'ingresos' ? 1n : -1n;
  return [...(e.movimientos.get(cuenta) ?? [])]
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))
    .map((i) => ({
      entryId: i.entryId,
      fecha: (e.base === 'flujo' ? i.fechaFlujo : i.fecha) ?? i.fecha,
      concepto: i.concepto,
      monto: monto(i.importe * signo),
    }));
}
