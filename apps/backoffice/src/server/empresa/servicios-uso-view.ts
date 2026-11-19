import { formatMoney, formatMoneyEntero } from '@xangarro/domain';
import {
  mesMas,
  promedioMensual,
  proyeccionDelMes,
  type CostosPorMes,
  type Proyeccion,
  type Servicio,
} from '@xangarro/domain/corp';

import { nombreMes } from './fechas';
import { costosDe, hrefServicio, type DatosServicios } from './servicios-textos';

/**
 * The services that charge by use (E-24, boards CD-18 and CD-18c): six
 * months of cost, the current one projected from what a founder read so far
 * (from day 3 on), the trend and the alert. Pure.
 */
export interface BarraMes {
  readonly mes: string;
  /** «Sep», «Oct*» for a projection, «Oct · 2 días» for a reading too short to project. */
  readonly etiqueta: string;
  readonly valor: string;
  /** 0–100 of the chart's height. */
  readonly alto: number;
  readonly proyeccion: boolean;
}

const corto = (mes: string) => {
  const n = nombreMes(mes).slice(0, 3);
  return n.charAt(0).toUpperCase() + n.slice(1);
};

export interface Lectura {
  readonly gasto: bigint;
  readonly dias: number;
  readonly proyeccion: Proyeccion | null;
}

/** What a founder read for this month, with its projection when it has 3 days. */
export function lecturaDe(s: Servicio, hoy: string): Lectura | null {
  const mes = hoy.slice(0, 7);
  if (s.cobro !== 'uso' || s.gastoMes === null || s.gastoAl === null) return null;
  if (s.gastoAl.slice(0, 7) !== mes) return null;
  const dias = Number(s.gastoAl.slice(8, 10));
  return { gasto: s.gastoMes, dias, proyeccion: proyeccionDelMes(s.gastoMes, s.gastoAl, mes) };
}

function etiquetaActual(mes: string, l: Lectura | null): string {
  if (l === null) return corto(mes);
  if (l.proyeccion !== null) return `${corto(mes)}*`;
  return `${corto(mes)} · ${l.dias === 1 ? '1 día' : `${l.dias} días`}`;
}

export interface Grafica {
  readonly barras: readonly BarraMes[];
  /** Where the alert's line sits, 0–100; null without one. */
  readonly aviso: number | null;
}

/** Five posted months and the current one, on a scale that reaches the alert line too. */
export function graficaDe(s: Servicio, costos: CostosPorMes, hoy: string): Grafica {
  const mes = hoy.slice(0, 7);
  const l = lecturaDe(s, hoy);
  const meses = [5, 4, 3, 2, 1].map((i) => mesMas(mes, -i));
  const valores = [
    ...meses.map((m) => costos.get(m) ?? 0n),
    l?.proyeccion?.monto ?? l?.gasto ?? costos.get(mes) ?? 0n,
  ];
  const max = [...valores, s.aviso ?? 0n].reduce((a, b) => (b > a ? b : a), 1n);
  const alto = (v: bigint) => Number((v * 1000n) / max) / 10;
  const barras = [...meses, mes].map((m, i) => {
    const v = valores[i] ?? 0n;
    const actual = m === mes;
    return {
      mes: m,
      etiqueta: actual ? etiquetaActual(mes, l) : corto(m),
      valor: formatMoneyEntero(v),
      alto: alto(v),
      proyeccion: actual && l?.proyeccion != null,
    };
  });
  return { barras, aviso: s.aviso === null ? null : alto(s.aviso) };
}

/** «Por uso, octubre»: the projections of the month, summed. */
export function lecturaDelMes(activos: readonly Servicio[], hoy: string) {
  const ls = activos
    .map((s) => lecturaDe(s, hoy)?.proyeccion)
    .filter((p): p is Proyeccion => p != null);
  const label = `Por uso, ${nombreMes(hoy.slice(0, 7))}`;
  if (ls.length === 0) return { label, valor: '—', nota: 'Aún sin 3 días de lectura este mes' };
  const dias = Math.max(...ls.map((p) => p.dias));
  return {
    label,
    valor: formatMoney(ls.reduce((t, p) => t + p.monto, 0n)),
    nota: `Proyección con ${dias} días de uso`,
  };
}

export interface Tendencia {
  readonly texto: string;
  readonly sube: boolean;
}

/** «↑ 38 % vs sep», «= estable» within 5 %, null without a month to compare with. */
export function tendencia(actual: bigint, previo: bigint, mesPrevio: string): Tendencia | null {
  if (previo <= 0n) return null;
  const pct = Math.round(Number(((actual - previo) * 1000n) / previo) / 10);
  const vs = `vs ${nombreMes(mesPrevio).slice(0, 3)}`;
  if (Math.abs(pct) < 5) return { texto: '= estable', sube: false };
  return pct > 0
    ? { texto: `↑ ${pct} % ${vs}`, sube: true }
    : { texto: `↓ ${-pct} % ${vs}`, sube: false };
}

export interface TarjetaUso {
  readonly id: string;
  readonly categoria: Servicio['categoria'];
  readonly href: string;
  readonly nombre: string;
  readonly para: string;
  readonly tendencia: Tendencia | null;
  readonly barras: readonly BarraMes[];
  readonly resumen: string;
  readonly nota: string;
  readonly pasa: boolean;
}

function notaDe(s: Servicio, proy: bigint | null): { nota: string; pasa: boolean } {
  if (s.cobro === 'comision')
    return {
      nota: 'Crece con los ingresos; se registra sola con cada depósito de Stripe.',
      pasa: false,
    };
  if (s.aviso === null) return { nota: 'Sin aviso: ponlo en Editar.', pasa: false };
  const pasa = proy !== null && proy > s.aviso;
  const a = formatMoneyEntero(s.aviso);
  return pasa
    ? { nota: `A este ritmo pasa del aviso de ${a}.`, pasa }
    : { nota: `Aviso si el mes pasa de ${a}.`, pasa };
}

export function tarjetaUso(s: Servicio, d: DatosServicios): TarjetaUso {
  const mes = d.hoy.slice(0, 7);
  const [m1, m2] = [mesMas(mes, -1), mesMas(mes, -2)];
  const costos = costosDe(s, d);
  const proy = lecturaDe(s, d.hoy)?.proyeccion?.monto ?? null;
  const ultimo = costos.get(m1) ?? 0n;
  const prom = promedioMensual(s.cobro, costos, mes);
  const resumen =
    proy !== null
      ? `${corto(m1)} ${formatMoneyEntero(ultimo)} · ${nombreMes(mes)} va a ${formatMoneyEntero(proy)}`
      : prom === null
        ? 'Aún sin gastos registrados'
        : `Promedio ${formatMoneyEntero(prom)} al mes`;
  return {
    id: s.id,
    categoria: s.categoria,
    href: hrefServicio(s.id),
    nombre: s.nombre,
    para: s.para ?? '',
    tendencia:
      proy !== null ? tendencia(proy, ultimo, m1) : tendencia(ultimo, costos.get(m2) ?? 0n, m2),
    barras: graficaDe(s, costos, d.hoy).barras,
    resumen,
    ...notaDe(s, proy),
  };
}

export function tarjetasUso(d: DatosServicios): readonly TarjetaUso[] {
  return d.servicios
    .filter((s) => s.estado === 'activo' && (s.cobro === 'uso' || s.cobro === 'comision'))
    .map((s) => tarjetaUso(s, d));
}
