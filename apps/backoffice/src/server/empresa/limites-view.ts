import type { IngresoDeProyecto } from '@xangarro/data-corp';
import { formatMoney, formatMoneyEntero } from '@xangarro/domain';
import {
  medidorDe,
  proyeccionAlCierre,
  type Medidor,
  type TopesDelAnio,
} from '@xangarro/domain/corp';

import { nombreMes } from './fechas';
import { alertaDe, type Alerta, type CualTope } from './limites-alertas';
import { mesesVecinos } from './movimiento-view';
import type { Senal } from './resumen-senales';

/**
 * Límites del año (E-15, board CD-12d): the SAS and RESICO gauges over the
 * whole company's income, their sources, the caps per year, the Resumen's
 * tile and the signals at 60, 80 and 95 %. Pure.
 */
export interface EntradaLimites {
  /** `YYYY-MM-DD`, Mexico City. */
  readonly hoy: string;
  readonly topes: readonly TopesDelAnio[];
  /** The year's income so far, per project. */
  readonly proyectos: readonly IngresoDeProyecto[];
  /** Last month's income, every project: the projection's pace. */
  readonly mesAnterior: bigint;
}

/** A share of a cap from its millionths: whole points from 1 %, one significant digit below. */
export function pct(ppm: number): string {
  if (ppm <= 0) return '0 %';
  if (ppm >= 10_000) return `${Math.trunc(ppm / 10_000)} %`;
  return `${(ppm / 10_000).toPrecision(1)} %`;
}

/** `$7.68 M`: a cap in the tile's few characters. */
const millones = (c: bigint) => `$${(Number(c) / 100_000_000).toFixed(2)} M`;

export interface MedidorVista {
  readonly id: CualTope;
  readonly nombre: string;
  readonly monto: string;
  readonly pct: string;
  /** Widths of the bar and its projection, 0–100. */
  readonly avance: number;
  readonly proyectado: number;
  readonly proyTexto: string;
  readonly alerta: Alerta | null;
  readonly queEs: string;
}

const NOMBRES: Record<CualTope, string> = {
  sas: 'Tope de la SAS',
  resico: 'Tope de RESICO persona moral',
};

const QUE_ES: Record<CualTope, string> = {
  sas: 'Las SAS solo pueden tener ingresos de hasta este monto al año (Ley General de Sociedades Mercantiles, art. 260). Avisa al llegar a 60, 80 y 95 %.',
  resico:
    'Arriba de este monto la empresa sale de RESICO y tributa en el régimen general (LISR, art. 206).',
};

function medidorVista(id: CualTope, m: Medidor): MedidorVista {
  return {
    id,
    nombre: NOMBRES[id],
    monto: `${formatMoney(m.ingresos)} de ${formatMoney(m.tope)}`,
    pct: pct(m.avance),
    avance: Math.min(m.avance / 10_000, 100),
    proyectado: Math.min(m.avanceProyectado / 10_000, 100),
    proyTexto: `A este ritmo, en diciembre: ${formatMoney(m.proyeccion)} (${pct(m.avanceProyectado)})`,
    alerta: alertaDe(id, m),
    queEs: QUE_ES[id],
  };
}

/** Where the Resumen's tile and signals open the drawer. */
export const HREF_LIMITES = '/empresa?limites=1';

function fuentesDe(e: EntradaLimites, mes: number, total: bigint) {
  const meses = mes === 1 ? 'enero' : `enero a ${nombreMes(e.hoy.slice(0, 7))}`;
  const filas = [
    { que: `Ingresos de ${meses}, sin IVA, de todos los proyectos`, cuanto: formatMoney(total) },
    ...e.proyectos.map((p) => ({ que: p.nombre, cuanto: formatMoney(p.monto) })),
  ];
  if (mes === 12) return filas;
  const previo = nombreMes(mesesVecinos(e.hoy.slice(0, 7)).anterior);
  const ritmo = e.mesAnterior > 0n ? e.mesAnterior : 0n;
  return [
    ...filas,
    {
      que: `Proyección: el ingreso de ${previo} (${formatMoney(ritmo)}) por cada mes que falta (${12 - mes})`,
      cuanto: `+${formatMoney(ritmo * BigInt(12 - mes))}`,
    },
  ];
}

function tablaDe(topes: readonly TopesDelAnio[], anio: number) {
  const filas = topes.map((t) => ({
    anio: String(t.anio),
    sas: formatMoney(t.sas),
    resico: formatMoney(t.resico),
    falta: false,
  }));
  if (topes.some((t) => t.anio === anio)) return filas;
  return [{ anio: String(anio), sas: 'Falta', resico: 'Falta', falta: true }, ...filas];
}

function sinTope(anio: number, total: bigint, mes: number) {
  const meses = mes === 1 ? 'enero' : 'enero a la fecha';
  return {
    titulo: String(anio),
    subtitulo: `Ingresos de ${meses}, sin IVA: ${formatMoney(total)}. El avance se calcula al capturar los topes.`,
    tope: {
      valor: `Falta ${anio}`,
      cambio: 'Captura el tope del año',
      ref: 'El DOF lo publica en diciembre',
      aviso: true,
    },
    senales: [
      {
        titulo: `Faltan los topes de ${anio}`,
        porque: 'Sin ellos no se mide el avance del año; no se usan los del año pasado.',
        accion: 'Capturar los topes',
        href: HREF_LIMITES,
        tono: 'warn',
      } satisfies Senal,
    ],
  };
}

const senalDe = (a: Alerta): Senal => ({
  ...a,
  porque: a.texto,
  accion: 'Ver límites',
  href: HREF_LIMITES,
});

export function limitesDe(e: EntradaLimites) {
  const anio = Number(e.hoy.slice(0, 4));
  const mes = Number(e.hoy.slice(5, 7));
  const total = e.proyectos.reduce((t, p) => t + p.monto, 0n);
  const actual = e.topes.find((t) => t.anio === anio);
  const comun = {
    anio,
    fuentes: fuentesDe(e, mes, total),
    topes: tablaDe(e.topes, anio),
    anterior: e.topes.find((t) => t.anio === anio - 1) ?? null,
  };
  if (actual === undefined)
    return { ...comun, conTope: false, medidores: [], ...sinTope(anio, total, mes) };
  const proyeccion = proyeccionAlCierre(total, e.mesAnterior, mes);
  const sas = medidorDe(total, proyeccion, actual.sas);
  const medidores = [
    medidorVista('sas', sas),
    medidorVista('resico', medidorDe(total, proyeccion, actual.resico)),
  ];
  return {
    ...comun,
    conTope: true,
    titulo: `${anio}, a ${nombreMes(e.hoy.slice(0, 7))}`,
    subtitulo: 'Ingresos de MEXIA en el año, sin IVA, de todos los proyectos.',
    medidores,
    tope: {
      valor: pct(sas.avance),
      cambio: `${formatMoneyEntero(total)} de ${millones(actual.sas)}`,
      ref: `Proyección a diciembre: ${pct(sas.avanceProyectado)}`,
      aviso: sas.nivel !== null && sas.nivel >= 80,
    },
    senales: medidores.flatMap((m) => (m.alerta === null ? [] : [senalDe(m.alerta)])),
  };
}

export type LimitesVista = ReturnType<typeof limitesDe>;
