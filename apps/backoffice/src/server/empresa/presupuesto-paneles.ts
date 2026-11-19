import { formatMoney, toPesosString } from '@xangarro/domain';
import {
  CATEGORIAS_GASTO,
  nombreTrimestre,
  presupuestoVigente,
  rangoDelTrimestre,
  totalMensual,
  type CategoriaGasto,
  type Montos,
  type Presupuesto,
} from '@xangarro/domain/corp';

import { fechaLarga } from './fechas';
import type { Calculo } from './presupuesto-calculo';
import { nombreCategoria } from './presupuesto-view';

/**
 * Board CD-15e's budget panels as figures: «Preparar», which starts from the
 * budget in force or else from what the last quarter spent; and «Aprobar»,
 * each proposed amount next to the quarter it follows and what was spent in
 * it. Pure.
 */
export interface CampoVista {
  readonly categoria: CategoriaGasto;
  readonly nombre: string;
  readonly inicial: string;
  readonly hint: string;
}

export interface Preparar {
  readonly trimestre: string;
  readonly nombre: string;
  readonly sub: string;
  readonly campos: readonly CampoVista[];
  readonly antes: string | null;
  readonly pasos: readonly string[];
}

export function prepararDe(c: Calculo, trimestre: string, otro: string): Preparar {
  const base = c.vigente;
  const tBase = nombreTrimestre(base === null ? c.anterior : c.trimestre);
  const actual = trimestre === c.trimestre;
  return {
    trimestre,
    nombre: nombreTrimestre(trimestre),
    sub:
      base === null
        ? `Un monto al mes por categoría. Empieza con lo gastado en el ${tBase}; cámbialo donde haga falta.`
        : `Un monto al mes por categoría. Empieza con lo del ${tBase}; cámbialo donde haga falta.`,
    campos: CATEGORIAS_GASTO.map((cat) => {
      const v = base === null ? c.promedioAnterior[cat] : base.montos[cat];
      return {
        categoria: cat,
        nombre: nombreCategoria(cat),
        inicial: v > 0n ? toPesosString(v) : '',
        hint:
          base === null
            ? `En el ${tBase} se gastaron ${formatMoney(v)} al mes`
            : `En el ${tBase}: ${formatMoney(v)} al mes`,
      };
    }),
    antes:
      base === null ? null : `el ${tBase} fue de ${formatMoney(totalMensual(base.montos))} al mes`,
    pasos: [
      `Le avisamos a ${otro} por correo para que lo apruebe.`,
      actual
        ? 'Cuenta desde que lo apruebe.'
        : `Cuenta desde el ${fechaLarga(rangoDelTrimestre(trimestre)[0])}, o desde que lo apruebe si ya empezó el trimestre.`,
      `Mientras no lo apruebe, el ${nombreTrimestre(trimestre)} no tiene presupuesto. El Límite de cada socio sigue igual.`,
    ],
  };
}

export interface FilaRevision {
  readonly nombre: string;
  readonly propuesto: string;
  readonly antes: string;
  readonly real: string;
}

export interface Revision {
  readonly ref: string;
  readonly filas: readonly FilaRevision[];
  readonly total: FilaRevision;
  readonly nota: string;
}

const fila = (nombre: string, p: bigint, antes: bigint | null, real: bigint): FilaRevision => ({
  nombre,
  propuesto: formatMoney(p),
  antes: antes === null ? '—' : formatMoney(antes),
  real: formatMoney(real),
});

/** Next to the quarter it follows: this one's budget and its projection, or the last one's. */
export function revisionDe(
  c: Calculo,
  p: Presupuesto,
  presupuestos: readonly Presupuesto[],
): Revision {
  const deEste = p.trimestre !== c.trimestre;
  const ref = deEste ? c.trimestre : c.anterior;
  const previo = deEste ? c.vigente : presupuestoVigente(presupuestos, c.anterior);
  const real: Montos = deEste
    ? (Object.fromEntries(
        CATEGORIAS_GASTO.map((cat) => [cat, c.delTrimestre.proyeccion[cat] / 3n]),
      ) as Record<CategoriaGasto, bigint>)
    : c.promedioAnterior;
  const sum = (m: Montos | undefined) => (m === undefined ? null : totalMensual(m));
  return {
    ref: nombreTrimestre(ref),
    filas: CATEGORIAS_GASTO.map((cat) =>
      fila(nombreCategoria(cat), p.montos[cat], previo?.montos[cat] ?? null, real[cat]),
    ),
    total: fila('Total al mes', totalMensual(p.montos), sum(previo?.montos), totalMensual(real)),
    nota: deEste
      ? `Gastado ${nombreTrimestre(ref)} es el promedio al mes del trimestre, con la proyección de lo que falta.`
      : `Gastado ${nombreTrimestre(ref)} es el promedio al mes de ese trimestre.`,
  };
}
