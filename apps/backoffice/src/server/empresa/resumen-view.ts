import { formatMoneyEntero, formatMonth } from '@xangarro/domain';
import {
  parsePeriodo,
  periodoAnterior,
  periodoDe,
  type EstadoResultados,
  type Periodo,
  type RenglonId,
} from '@xangarro/domain/corp';

import type { Rol } from './resultados-graficas';
import { hrefResultados, nombrePeriodo, type Tono } from './resultados-view';

/**
 * Resumen's tiles and «De dónde sale la utilidad» (E-16, board CD-12b): the
 * period's results, read like Resultados reads them (devengado), against the
 * period before. Pure: the page reads, this shapes.
 */
export function parseVistaResumen(q: { readonly periodo?: string }, hoy: string): Periodo {
  return parsePeriodo(q.periodo ?? '') ?? periodoDe('mes', hoy);
}

export const hrefResumen = (p: Periodo): string => `/empresa?periodo=${p.clave}`;

/** «octubre», «T3 2026», «2026»: a period inside a sentence. */
export function corto(p: Periodo): string {
  if (p.tipo === 'mes') return formatMonth(p.clave).split(' ')[0] ?? p.clave;
  if (p.tipo === 'trimestre') return `${p.clave.slice(5)} ${p.clave.slice(0, 4)}`;
  return p.clave;
}

/** «de octubre», «del 3.er trimestre de 2026», «de 2026». */
function delPeriodo(p: Periodo): string {
  return p.tipo === 'trimestre' ? `del ${nombrePeriodo(p)}` : `de ${corto(p)}`;
}

const ENTERO_DEL: Record<Periodo['tipo'], string> = {
  mes: 'el mes',
  trimestre: 'el trimestre',
  anio: 'el año',
};

const entero = (v: bigint) => formatMoneyEntero(v).replace('-', '−');

/** A margin truncated to whole points, so 69.9 % never reads as the 70 % target. */
export const puntos = (bps: number): number => Math.trunc(bps / 100);

export interface Kpi {
  readonly label: string;
  readonly valor: string;
  readonly cambio: string;
  readonly tono: Tono;
  readonly ref: string;
  readonly href: string;
}

const tonoDe = (d: number | bigint): Tono => (d > 0 ? 'bien' : d < 0 ? 'mal' : 'igual');

function cambioDinero(d: bigint, antes: string): Pick<Kpi, 'cambio' | 'tono'> {
  if (d === 0n) return { cambio: `Igual que ${antes}`, tono: 'igual' };
  const signo = d > 0n ? '+' : '−';
  return { cambio: `${signo}${entero(d < 0n ? -d : d)} vs ${antes}`, tono: tonoDe(d) };
}

function margen(actual: EstadoResultados, anterior: EstadoResultados, antes: string) {
  const ahora = corto(actual.periodo);
  if (actual.margenBruto === null) {
    const cambio = actual.faltanGastos
      ? `Sin gastos registrados en ${ahora}`
      : `Sin ingresos en ${ahora}`;
    return { valor: 'Sin datos', cambio, tono: 'igual' as const };
  }
  const valor = `${puntos(actual.margenBruto)} %`;
  if (anterior.margenBruto === null) {
    return { valor, cambio: `Sin datos de ${antes}`, tono: 'igual' as const };
  }
  const d = puntos(actual.margenBruto) - puntos(anterior.margenBruto);
  if (d === 0) return { valor, cambio: `Igual que ${antes}`, tono: 'igual' as const };
  const pts = Math.abs(d) === 1 ? 'pt' : 'pts';
  return {
    valor,
    cambio: `${d > 0 ? '+' : '−'}${Math.abs(d)} ${pts} vs ${antes}`,
    tono: tonoDe(d),
  };
}

/** The four tiles CD-12b keeps: the rest wait for their tasks (plan E-16). */
export function kpisDe(actual: EstadoResultados, anterior: EstadoResultados): Kpi[] {
  const r = actual.renglones;
  const antes = corto(periodoAnterior(actual.periodo));
  const href = hrefResultados({ periodo: actual.periodo, base: 'devengado', abrir: null });
  // An empty period has no loss to explain: CD-12c keeps the tile's usual note.
  const sinIsr =
    actual.movimientos.size > 0 && r.isr_estimado === 0n && r.utilidad_antes_impuestos <= 0n;
  const refs = {
    ingresos: `Devengado: lo facturado en ${ENTERO_DEL[actual.periodo.tipo]}`,
    margen: 'Meta: 75 % o más',
    ebitda: 'Antes de depreciación e impuestos',
    neta: sinIsr ? 'Sin ISR: no hay utilidad' : 'Después de ISR estimado',
  };
  const dinero = (id: RenglonId) => ({
    valor: entero(r[id]),
    ...cambioDinero(r[id] - anterior.renglones[id], antes),
  });
  const tiles = [
    { label: 'Ingresos netos', ref: refs.ingresos, ...dinero('ingresos') },
    { label: 'Margen bruto', ref: refs.margen, ...margen(actual, anterior, antes) },
    { label: 'EBITDA', ref: refs.ebitda, ...dinero('ebitda') },
    { label: 'Utilidad neta', ref: refs.neta, ...dinero('utilidad_neta') },
  ];
  if (actual.movimientos.size > 0) return tiles.map((t) => ({ ...t, href }));
  const vacio = `Sin movimientos en ${corto(actual.periodo)}`;
  return tiles.map((t) => ({ ...t, href, valor: 'Sin datos', cambio: vacio, tono: 'igual' }));
}

export interface FilaPuente {
  readonly label: string;
  readonly valor: string;
  /** Percent of the widest amount, the costs' total included. */
  readonly ancho: number;
  readonly rol: Rol;
  readonly fuerte: boolean;
}

const COSTOS: readonly (readonly [RenglonId, string, Rol])[] = [
  ['costo_servicio', 'Costo del servicio', 'costoServicio'],
  ['ventas_marketing', 'Ventas y marketing', 'ventasMarketing'],
  ['desarrollo', 'Desarrollo', 'desarrollo'],
  ['administracion', 'Administración', 'administracion'],
];

/** Below EBITDA, a line shows only when it moved. */
const DEBAJO: readonly (readonly [RenglonId, string])[] = [
  ['depreciacion', 'Depreciación'],
  ['financiero', 'Resultado financiero'],
  ['isr_estimado', 'ISR estimado'],
];

const abs = (v: bigint) => (v < 0n ? -v : v);

function nota(ingresos: bigint, costos: bigint, p: Periodo): string {
  const suman = `Los costos ${delPeriodo(p)} suman ${entero(costos)}`;
  if (ingresos <= 0n) return `${suman}, sin ingresos.`;
  if (costos > ingresos) {
    const veces = Math.trunc(Number((costos * 10n) / ingresos)) / 10;
    return `${suman}: ${veces.toLocaleString('es-MX')} veces los ingresos.`;
  }
  return `${suman}: ${Number((costos * 100n) / ingresos)} % de los ingresos.`;
}

/** «De dónde sale la utilidad»: income, each cost and what is left, as bars from zero. */
export function puenteResumen(e: EstadoResultados): {
  readonly filas: readonly FilaPuente[];
  readonly nota: string;
} {
  if (e.movimientos.size === 0) {
    const en = e.periodo.tipo === 'trimestre' ? `el ${nombrePeriodo(e.periodo)}` : corto(e.periodo);
    return { filas: [], nota: `Sin ingresos ni gastos en ${en}.` };
  }
  const r = e.renglones;
  const resultado = (id: RenglonId, label: string) => ({
    id,
    label,
    rol: (r[id] < 0n ? 'perdida' : 'restante') as Rol,
    fuerte: true,
  });
  const lineas = [
    { id: 'ingresos' as RenglonId, label: 'Ingresos', rol: 'ingreso' as Rol, fuerte: true },
    ...COSTOS.map(([id, label, rol]) => ({ id, label, rol, fuerte: false })),
    resultado('ebitda', 'EBITDA'),
    ...DEBAJO.filter(([id]) => r[id] !== 0n).map(([id, label]) => ({
      id,
      label,
      rol: 'impuesto' as Rol,
      fuerte: false,
    })),
    resultado('utilidad_neta', 'Utilidad neta'),
  ];
  const costos = COSTOS.reduce((t, [id]) => t - r[id], 0n);
  const escala = lineas.reduce((t, l) => (abs(r[l.id]) > t ? abs(r[l.id]) : t), costos) || 1n;
  return {
    filas: lineas.map((l) => ({
      label: l.label,
      valor: entero(r[l.id]),
      ancho: Number((abs(r[l.id]) * 1000n) / escala) / 10,
      rol: l.rol,
      fuerte: l.fuerte,
    })),
    nota: nota(r.ingresos, costos, e.periodo),
  };
}
