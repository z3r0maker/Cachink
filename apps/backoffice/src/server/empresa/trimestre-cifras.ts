import { formatMoneyEntero } from '@xangarro/domain';
import {
  cajaAl,
  costoDeSudor,
  crecimiento,
  dineroDelRango,
  estadoDeResultados,
  nombreTrimestre,
  rangoDelResumen,
  rangoDelTrimestre,
  resumenDelTrimestre,
  trimestreAnterior,
  trimestresHasta,
  ultimoDiaDelTrimestre,
  type EstadoResultados,
} from '@xangarro/domain/corp';

import { fechaCorta } from './fechas';
import { porcentaje } from './resultados-view';
import type { LecturaTrimestre } from './trimestre-lectura';

/**
 * Socios › Trimestre's figures (E-17, board CD-17b): the main card, quarter
 * against quarter, and the totals of the year and since the start. Devengado,
 * as Resultados opens (OD-1). A quarter in progress counts up to today.
 */
export type Tono = 'sube' | 'baja' | 'igual';

export interface Tile {
  readonly label: string;
  readonly value: string;
  readonly delta: string;
  readonly tono: Tono;
}

const dinero = (v: bigint) => formatMoneyEntero(v).replace('-', '−');

export const resultadosDe = (l: LecturaTrimestre, desde: string, hasta: string): EstadoResultados =>
  estadoDeResultados(
    l.importes,
    { tipo: 'trimestre', clave: `${desde}~${hasta}`, desde, hasta },
    'devengado',
  );

const conMargen = (r: EstadoResultados) =>
  r.margenEbitda === null
    ? dinero(r.renglones.ebitda)
    : `${dinero(r.renglones.ebitda)} · ${porcentaje(r.margenEbitda)}`;

const signo = (n: number | null, base: string): { delta: string; tono: Tono } =>
  n === null
    ? { delta: `sin base vs ${base}`, tono: 'igual' }
    : {
        delta: `${n > 0 ? '+' : ''}${n} % vs ${base}`,
        tono: n > 0 ? 'sube' : n < 0 ? 'baja' : 'igual',
      };

function tablero(l: LecturaTrimestre): Tile {
  const r = resumenDelTrimestre({
    trimestre: l.trimestre,
    tarjetas: l.tablero.tarjetas,
    planes: l.tablero.planes,
    hoy: l.hoy,
  });
  const aceptado = r.socios[0].aceptado + r.socios[1].aceptado;
  const comprometido = r.socios[0].comprometido + r.socios[1].comprometido;
  return {
    label: 'Valor aceptado en el Tablero',
    value: dinero(aceptado),
    delta: `De ${dinero(comprometido)} comprometidos`,
    tono: 'igual',
  };
}

export function tiles(l: LecturaTrimestre): Tile[] {
  const antes = trimestreAnterior(l.trimestre);
  const [d0, h0] = [rangoDelTrimestre(antes)[0], ultimoDiaDelTrimestre(antes)];
  const actual = resultadosDe(l, l.rango.desde, l.rango.hasta);
  const previo = resultadosDe(l, d0, h0);
  const base = nombreTrimestre(antes).split(' ')[0] ?? antes;
  const enCurso = l.rango.estado === 'en_curso';
  const al = enCurso ? ` al ${fechaCorta(l.hoy)}` : '';
  const caja = cajaAl(l.movs, l.rango.hasta);
  const cambio = caja - cajaAl(l.movs, h0);
  const ingresos = actual.renglones.ingresos;
  return [
    {
      label: `Ingresos${al}`,
      value: dinero(ingresos),
      ...(enCurso
        ? {
            delta: `${dinero(previo.renglones.ingresos)} en todo el ${base}`,
            tono: 'igual' as const,
          }
        : signo(crecimiento(ingresos, previo.renglones.ingresos), base)),
    },
    {
      label: `EBITDA${al}`,
      value: conMargen(actual),
      delta: `${base}: ${conMargen(previo)}`,
      tono: 'igual',
    },
    {
      label: enCurso ? 'Caja hoy' : 'Caja al cierre',
      value: dinero(caja),
      delta: `${cambio >= 0n ? '+' : '−'}${dinero(cambio < 0n ? -cambio : cambio)} ${enCurso ? 'en lo que va' : 'en el trimestre'}`,
      tono: cambio > 0n ? 'sube' : cambio < 0n ? 'baja' : 'igual',
    },
    tablero(l),
  ];
}

export interface Barra {
  readonly label: string;
  readonly valores: string;
  readonly crecimiento: string;
  readonly tono: Tono;
  readonly ingresos: bigint;
  readonly ebitda: bigint;
}

/** The last four quarters to the one on screen; growth is income against the one before. */
export function trimestres(l: LecturaTrimestre): Barra[] {
  return trimestresHasta(l.trimestre, 4).map((t) => {
    const r = rangoDelResumen(t, l.hoy);
    const e = resultadosDe(l, r.desde, r.hasta);
    const antes = trimestreAnterior(t);
    const p = resultadosDe(l, rangoDelTrimestre(antes)[0], ultimoDiaDelTrimestre(antes));
    const enCurso = r.estado === 'en_curso';
    const g = crecimiento(e.renglones.ingresos, p.renglones.ingresos);
    return {
      label: enCurso ? `${nombreTrimestre(t)} al ${fechaCorta(l.hoy)}` : nombreTrimestre(t),
      valores: `${dinero(e.renglones.ingresos)} · EBITDA ${dinero(e.renglones.ebitda)}`,
      crecimiento: enCurso ? 'en curso' : g === null ? 'sin base' : `${g > 0 ? '+' : ''}${g} %`,
      tono: enCurso || g === null ? 'igual' : g >= 0 ? 'sube' : 'baja',
      ingresos: e.renglones.ingresos,
      ebitda: e.renglones.ebitda,
    };
  });
}

export interface Acumulado {
  readonly label: string;
  readonly value: string;
  readonly desdeElInicio: string;
}

/** The first day anything was posted; null with an empty ledger. */
export const primerDia = (l: LecturaTrimestre): string | null =>
  [...l.importes.map((i) => i.fecha), ...l.movs.map((m) => m.fecha)].sort()[0] ?? null;

export function acumulado(l: LecturaTrimestre): Acumulado[] {
  const hasta = l.rango.hasta;
  const anio = `${hasta.slice(0, 4)}-01-01`;
  const inicio = primerDia(l) ?? anio;
  const par = (f: (desde: string) => bigint) => ({
    value: dinero(f(anio)),
    desdeElInicio: `Desde el inicio: ${dinero(f(inicio))}`,
  });
  return [
    { label: 'Ingresos', ...par((d) => resultadosDe(l, d, hasta).renglones.ingresos) },
    { label: 'EBITDA', ...par((d) => resultadosDe(l, d, hasta).renglones.ebitda) },
    { label: 'Aportado por los socios', ...par((d) => dineroDelRango(l.movs, d, hasta).aportado) },
    { label: 'Impuestos pagados', ...par((d) => dineroDelRango(l.movs, d, hasta).impuestos) },
    {
      label: 'Valor aceptado en el Tablero',
      ...par((d) => costoDeSudor(l.tablero.tarjetas, { desde: d, hasta }, l.hoy).valor),
    },
  ];
}
