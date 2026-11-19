import { formatMoney, formatMoneyEntero, formatMonth } from '@xangarro/domain';
import {
  cajaAlCierre,
  mesesDeHistoria,
  proyeccion,
  reservaMinima,
  type Autonomia,
  type Escenario,
  type MovimientoCaja,
} from '@xangarro/domain/corp';

import { nombreMes } from './fechas';
import { mesesVecinos } from './movimiento-view';

/**
 * «Caja al cierre de cada mes» (E-23, board CD-15c): the months since the
 * first with money, up to six, then six projected under the chosen scenario,
 * with the reserve line. Heights are percentages of the chart, so the page
 * only draws (the console's CSP drops inline styles). Pure.
 */
export const MESES_REALES = 6;
export const MESES_PROYECTADOS = 6;

export interface BarraCaja {
  readonly mes: string;
  readonly label: string;
  readonly valor: string;
  /** Percent of the chart's height. */
  readonly alto: number;
  readonly real: boolean;
}

export interface GraficaCaja {
  readonly titular: string;
  readonly explica: string;
  readonly barras: readonly BarraCaja[];
  readonly reserva: string;
  /** Percent of the chart's height where the reserve line sits. */
  readonly reservaAlto: number;
}

export const ESCENARIOS: readonly (readonly [Escenario, string])[] = [
  ['mantener', 'Si los ingresos se mantienen'],
  ['equilibrio', 'Si bajan al equilibrio'],
  ['detener', 'Si se detuvieran hoy'],
];

export function parseEscenario(raw: string | undefined): Escenario {
  return raw === 'equilibrio' || raw === 'detener' ? raw : 'mantener';
}

/** «$119k», rounded in centavos, never through a float. */
const k = (v: bigint) => `$${((v + 50_000n) / 100_000n).toString()}k`;
const corto = (mes: string) => {
  const n = nombreMes(mes);
  return `${n.charAt(0).toUpperCase()}${n.slice(1, 3)}`;
};
const unDecimal = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 1 });

function siguientes(mes: string, n: number): string[] {
  const out: string[] = [];
  let m = mes;
  for (let i = 0; i < n; i++) out.push((m = mesesVecinos(m).siguiente));
  return out;
}

function mantener(a: Autonomia, hoy: string): readonly [string, string] {
  if (a.neto >= 0n) {
    const fin = siguientes(hoy.slice(0, 7), MESES_PROYECTADOS).at(-1) ?? hoy.slice(0, 7);
    const total = a.caja + a.neto * BigInt(MESES_PROYECTADOS);
    return [
      `La caja crece ${formatMoney(a.neto)} al mes`,
      `Con lo que entra hoy, en ${formatMonth(fin)} habría ${formatMoney(total)}.`,
    ];
  }
  return [
    `Alcanza ${unDecimal(a.mesesDeCaja ?? 0)} meses al ritmo de hoy`,
    `Sale ${formatMoney(-a.neto)} más de lo que entra cada mes.`,
  ];
}

function equilibrio(a: Autonomia): readonly [string, string] {
  const titular = `Para no bajar, hacen falta ${formatMoney(a.sale)} al mes`;
  if (a.neto >= 0n && a.caidaMaximaBps !== null) {
    const pct = Math.floor(a.caidaMaximaBps / 100);
    return [titular, `Los ingresos pueden bajar ${pct} % antes de que la caja empiece a bajar.`];
  }
  return [
    titular,
    `Hoy entran ${formatMoney(a.entra)}: faltan ${formatMoney(-a.neto)} al mes para el punto de equilibrio.`,
  ];
}

function detener(a: Autonomia, hoy: string): readonly [string, string] {
  if (a.mesesSinIngresos === null) return ['Sin gastos registrados, la caja no baja', ''];
  const titular = `Sin ingresos, alcanza ${unDecimal(a.mesesSinIngresos)} meses`;
  const reserva = reservaMinima(a.sale);
  if (a.caja < reserva) return [titular, 'La caja ya está debajo de la reserva mínima.'];
  const meses = siguientes(hoy.slice(0, 7), MESES_PROYECTADOS * 4);
  const i = proyeccion(a, 'detener', meses.length).findIndex((v) => v < reserva);
  const cuando = meses[i];
  return [
    titular,
    cuando === undefined
      ? 'Aun sin ingresos, la caja no bajaría de la reserva mínima en dos años.'
      : `Si no entrara nada desde hoy, la caja bajaría de la reserva mínima en ${formatMonth(cuando)}.`,
  ];
}

export function textosDe(a: Autonomia, e: Escenario, hoy: string): readonly [string, string] {
  if (e === 'equilibrio') return equilibrio(a);
  return e === 'detener' ? detener(a, hoy) : mantener(a, hoy);
}

const pct = (v: bigint, max: bigint) => (max <= 0n ? 0 : Number((v * 1000n) / max) / 10);

export function graficaDe(
  movs: readonly MovimientoCaja[],
  a: Autonomia,
  e: Escenario,
  hoy: string,
): GraficaCaja {
  const reales = cajaAlCierre(movs, mesesDeHistoria(movs, hoy).slice(-MESES_REALES), hoy);
  const futuros = siguientes(hoy.slice(0, 7), MESES_PROYECTADOS);
  const proy = proyeccion(a, e, futuros.length).map((caja, i) => ({ mes: futuros[i] ?? '', caja }));
  const reserva = reservaMinima(a.sale);
  const max = [...reales, ...proy].reduce((m, x) => (x.caja > m ? x.caja : m), reserva);
  const barra = (x: { mes: string; caja: bigint }, real: boolean): BarraCaja => ({
    mes: x.mes,
    label: corto(x.mes),
    valor: x.caja === 0n ? '$0' : k(x.caja),
    alto: pct(x.caja < 0n ? 0n : x.caja, max),
    real,
  });
  const [titular, explica] = textosDe(a, e, hoy);
  return {
    titular,
    explica,
    barras: [...reales.map((x) => barra(x, true)), ...proy.map((x) => barra(x, false))],
    reserva: formatMoneyEntero(reserva),
    reservaAlto: pct(reserva, max),
  };
}
