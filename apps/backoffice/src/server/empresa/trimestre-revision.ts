import type { DocumentoMeta, ObligacionVista } from '@xangarro/application/corp';
import { formatMoneyEntero } from '@xangarro/domain';
import {
  dineroDelRango,
  nombreTrimestre,
  resultadoDelObjetivo,
  resumenDelTrimestre,
  trimestreSiguiente,
  type Socio,
} from '@xangarro/domain/corp';

import { fechaCorta, fechaEnMexico, nombreMes } from './fechas';
import type { LecturaTrimestre } from './trimestre-lectura';

/**
 * Socios › Trimestre's review (E-17, board CD-17b): the objectives, each
 * partner's Tablero, the partners' money, and compliance with evidence.
 */
const dinero = (v: bigint) => formatMoneyEntero(v);

export interface ObjetivoTrimestre {
  readonly marca: 'si' | 'no' | 'curso';
  readonly titulo: string;
  readonly resultado: string;
}

export function objetivos(l: LecturaTrimestre): { titulo: string; filas: ObjetivoTrimestre[] } {
  const os = l.tablero.objetivos.filter((o) => o.trimestre === l.trimestre);
  const filas = os.map((o): ObjetivoTrimestre => {
    const r = resultadoDelObjetivo(o, l.hoy);
    const quien = o.quien === null ? 'Ambos' : l.nombres[o.quien];
    const avance = `${r.avance} de ${o.meta} ${o.unidad}`;
    if (r.cumplido === null)
      return { marca: 'curso', titulo: o.titulo, resultado: `${avance} · ${quien}` };
    return {
      marca: r.cumplido ? 'si' : 'no',
      titulo: o.titulo,
      resultado: `${r.cumplido ? 'Cumplido' : 'No cumplido'}: ${avance} · ${quien}`,
    };
  });
  const cumplidos = filas.filter((f) => f.marca === 'si').length;
  const titulo =
    l.rango.estado === 'cerrado'
      ? `Objetivos · ${cumplidos} de ${filas.length}`
      : 'Objetivos · en curso';
  return { titulo, filas };
}

export interface SocioTrimestre {
  readonly socio: Socio;
  readonly nombre: string;
  readonly chip: string;
  readonly tono: 'ok' | 'bad' | 'off';
  readonly ancho: number;
  readonly detalle: string;
}

type Resumen = ReturnType<typeof resumenDelTrimestre>;
type ResumenDeSocio = Resumen['socios'][number];

function chipDe(s: ResumenDeSocio): Pick<SocioTrimestre, 'chip' | 'tono'> {
  const p = s.porcentaje === null ? 'sin compromiso' : `${s.porcentaje} %`;
  if (s.cumple === null) return { chip: 'En curso', tono: 'off' };
  return s.cumple
    ? { chip: `Cumplió · ${p}`, tono: 'ok' }
    : { chip: `No cumplió · ${p}`, tono: 'bad' };
}

function detalleDe(s: ResumenDeSocio, r: Resumen, siguiente: string): string {
  const base = `Aceptado ${dinero(s.aceptado)} de ${dinero(s.comprometido)}`;
  if (s.cumple === null) return `${base} · ${dinero(s.enRevision)} en revisión`;
  const n = r.arrastre.filter(
    (t) => t.tarjeta.responsable === s.socio && t.tarjeta.descartadaEn === null,
  ).length;
  if (n === 0) return base;
  return `${base} · ${n === 1 ? '1 tarjeta pasó' : `${n} tarjetas pasaron`} al ${siguiente}`;
}

export function socios(l: LecturaTrimestre): { filas: SocioTrimestre[]; fondeo: string } {
  const r = resumenDelTrimestre({
    trimestre: l.trimestre,
    tarjetas: l.tablero.tarjetas,
    planes: l.tablero.planes,
    hoy: l.hoy,
  });
  const siguiente = nombreTrimestre(trimestreSiguiente(l.trimestre)).split(' ')[0] ?? '';
  const filas = r.socios.map((s): SocioTrimestre => ({
    socio: s.socio,
    nombre: l.nombres[s.socio],
    ...chipDe(s),
    ancho: s.porcentaje === null ? 0 : Math.min(100, s.porcentaje),
    detalle: detalleDe(s, r, siguiente),
  }));
  const { aportado } = dineroDelRango(l.movs, l.rango.desde, l.rango.hasta);
  const fondeo =
    aportado === 0n
      ? 'Dinero de los socios en el trimestre: nada.'
      : `Dinero de los socios en el trimestre: ${dinero(aportado)}.`;
  return { filas, fondeo };
}

/** Every step's evidence filed on or before the due day, Mexico City. */
function aTiempo(o: ObligacionVista, docs: readonly DocumentoMeta[]): boolean {
  if (!o.cumplida) return false;
  const pasos = (['presentada', 'pagada'] as const).flatMap((p) => {
    const tipo = o.plantilla.evidencia[p];
    return tipo === undefined || (p === 'pagada' && o.sinPago) ? [] : [tipo];
  });
  return pasos.every((tipo) =>
    docs.some((d) => d.tipo === tipo && fechaEnMexico(d.subidoEn) <= o.vence),
  );
}

export interface Linea {
  readonly texto: string;
  readonly alerta: boolean;
}

function lineaCierres(l: LecturaTrimestre): Linea {
  const meses = [...l.cierres.entries()];
  const abiertos = meses.filter(([, f]) => f === null).map(([m]) => nombreMes(m));
  const ultimo = meses.at(-1);
  if (abiertos.length > 0) {
    return { texto: `Sin cerrar: ${abiertos.join(', ')}.`, alerta: l.rango.estado === 'cerrado' };
  }
  const cuando =
    ultimo?.[1] === null || ultimo === undefined
      ? ''
      : `; ${nombreMes(ultimo[0])} el ${fechaCorta(ultimo[1])}`;
  return { texto: `Cada mes se cerró${cuando}.`, alerta: false };
}

function lineaOpinion(l: LecturaTrimestre): Linea | null {
  const ops = l.obligaciones.filter((o) => o.plantilla.id === 'opinion_32d');
  if (ops.length === 0) return null;
  const si = ops.filter((o) => o.cumplida).map((o) => nombreMes(o.periodo));
  const no = ops.filter((o) => !o.cumplida).map((o) => nombreMes(o.periodo));
  if (no.length === 0)
    return {
      texto: `Opinión de cumplimiento del SAT: descargada en ${si.join(', ')}.`,
      alerta: false,
    };
  return { texto: `Falta la opinión de cumplimiento de ${no.join(', ')}.`, alerta: true };
}

export function cumplimiento(l: LecturaTrimestre): { cuenta: string; lineas: Linea[] } {
  const vencidas = l.obligaciones.filter((o) => o.vence <= l.hoy);
  const bien = vencidas.filter((o) =>
    aTiempo(o, l.documentos.get(`${o.plantilla.id}~${o.periodo}`) ?? []),
  );
  const pendientes = l.obligaciones
    .filter((o) => !o.cumplida)
    .slice(0, 2)
    .map((o): Linea => ({
      texto: `Pendiente: ${o.titulo}, ${o.vence < l.hoy ? 'vencida' : `vence el ${fechaCorta(o.vence)}`}.`,
      alerta: o.vence < l.hoy,
    }));
  const opinion = lineaOpinion(l);
  return {
    cuenta: `${bien.length} de ${vencidas.length}`,
    lineas: [...(opinion === null ? [] : [opinion]), ...pendientes, lineaCierres(l)],
  };
}
