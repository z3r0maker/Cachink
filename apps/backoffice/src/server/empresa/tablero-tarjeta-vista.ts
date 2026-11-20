import type { ObligacionVista } from '@xangarro/application/corp';
import { formatMoneyEntero } from '@xangarro/domain';
import {
  otroSocio,
  type Columna,
  type Objetivo,
  type Socio,
  type TarjetaEnTrimestre,
  type ValorDeTarjeta,
} from '@xangarro/domain/corp';

import { hrefDe } from './agenda-view';
import { fechaCorta } from './fechas';
import { hrefTablero, iniciales, type Filtro } from './tablero-view';

/**
 * A card on the kanban in board CD-13b's words (E-20): its kind, value,
 * criterion, the line that says where it stands, who and when. Obligations
 * come from the Agenda and link back to it.
 */
export type Tono = 'ok' | 'warn' | 'bad' | 'info' | 'off';
export type Clase = 'entregable' | 'tarea' | 'obligacion';

export interface TarjetaVista {
  readonly clave: string;
  readonly href: string;
  readonly clase: Clase;
  readonly valor: string | null;
  readonly titulo: string;
  readonly criterio: string;
  readonly estado: string | null;
  readonly tono: Tono;
  readonly quien: string;
  readonly responsable: Socio | null;
  readonly fecha: string;
  readonly objetivo: string | null;
  readonly columna: Columna;
}

const dinero = (c: bigint | null): string | null => (c === null ? null : formatMoneyEntero(c));

export function lineaDeValor(v: ValorDeTarjeta, t: TarjetaEnTrimestre['tarjeta']) {
  const { 1: a, 2: b } = t.valores;
  switch (v.fuente) {
    case 'falta':
      return { estado: 'Falta un valor', tono: 'warn' as const };
    case 'cotizacion_requerida':
      return { estado: 'Requiere cotización', tono: 'bad' as const };
    case 'cotizacion':
      return { estado: 'Valor: cotización de un tercero', tono: 'info' as const };
    case 'promedio':
      return {
        estado:
          a === b
            ? `Valor: ${dinero(a)}, los dos igual`
            : `Valor: promedio de ${dinero(a)} y ${dinero(b)}`,
        tono: 'info' as const,
      };
  }
}

function aceptada(t: TarjetaEnTrimestre, n: (s: Socio) => string): string {
  const e = t.estado;
  const el = fechaCorta(e.aceptadaEl ?? '');
  if (e.como === 'silencio') return `Aceptado el ${el} · sin objeción`;
  if (e.como === 'mediador') return `Aceptado por el mediador el ${el}`;
  return `Aceptado el ${el} por ${n(otroSocio(t.tarjeta.responsable))}`;
}

type Linea = { readonly estado: string | null; readonly tono: Tono };

function lineaDeTarea(t: TarjetaEnTrimestre): Linea {
  return t.estado.fase === 'hecha'
    ? { estado: `Hecha el ${fechaCorta(t.estado.aceptadaEl ?? '')}`, tono: 'ok' }
    : { estado: null, tono: 'off' };
}

function enRevision(t: TarjetaEnTrimestre, n: (s: Socio) => string): Linea {
  const e = t.estado;
  const otro = n(otroSocio(t.tarjeta.responsable));
  return {
    estado: `Terminado el ${fechaCorta(e.terminadaEl ?? '')} · ${otro} puede objetar hasta el ${fechaCorta(e.plazo ?? '')}`,
    tono: 'warn',
  };
}

function objetada(t: TarjetaEnTrimestre): Linea {
  const e = t.estado;
  return e.mediadorNo !== null
    ? { estado: `El mediador no la aceptó el ${fechaCorta(e.mediadorNo)}`, tono: 'bad' }
    : { estado: `Objetada: ${e.objecion?.motivo ?? ''}`, tono: 'bad' };
}

/** The line under the criterion: where the card stands now. */
export function lineaDeEstado(t: TarjetaEnTrimestre, n: (s: Socio) => string): Linea {
  if (t.tarjeta.tipo === 'tarea') return lineaDeTarea(t);
  switch (t.estado.fase) {
    case 'por_hacer':
    case 'en_curso':
      return lineaDeValor(t.valor, t.tarjeta);
    case 'en_revision':
      return enRevision(t, n);
    case 'objetada':
      return objetada(t);
    case 'al_mediador':
      return { estado: 'Con el mediador', tono: 'info' };
    default:
      return { estado: aceptada(t, n), tono: 'ok' };
  }
}

export function vistaDeTarjeta(
  t: TarjetaEnTrimestre,
  trimestre: string,
  objetivos: readonly Objetivo[],
  n: (s: Socio) => string,
): TarjetaVista {
  const c = t.tarjeta;
  const { estado, tono } = lineaDeEstado(t, n);
  const terminada = t.estado.terminadaEl;
  return {
    clave: c.id,
    href: hrefTablero(trimestre, { tarjeta: c.id }),
    clase: c.tipo,
    valor: c.tipo === 'tarea' ? null : dinero(t.valor.valor),
    titulo: c.titulo,
    criterio: t.arrastrada ? `Viene del trimestre anterior. ${c.criterio}` : c.criterio,
    estado,
    tono,
    quien: iniciales(c.responsable),
    responsable: c.responsable,
    fecha:
      terminada === null ? `Vence ${fechaCorta(c.vence)}` : `Terminado ${fechaCorta(terminada)}`,
    objetivo: objetivos.find((o) => o.id === c.objetivoId)?.titulo ?? null,
    columna: t.columna,
  };
}

export function vistaDeObligacion(o: ObligacionVista): TarjetaVista {
  return {
    clave: `${o.plantilla.id}~${o.periodo}`,
    href: hrefDe(o),
    clase: 'obligacion',
    valor: null,
    titulo: o.titulo,
    criterio: 'Viene de la Agenda: se marca allá, con su evidencia.',
    estado: o.cumplida ? 'Cumplida en la Agenda' : null,
    tono: o.cumplida ? 'ok' : 'off',
    quien: 'Agenda',
    responsable: null,
    fecha: `Vence ${fechaCorta(o.vence)}`,
    objetivo: null,
    columna: o.cumplida ? 'terminado' : 'por_hacer',
  };
}

export function pasaElFiltro(t: TarjetaVista, ver: Filtro): boolean {
  switch (ver) {
    case 'todo':
      return true;
    case 'f1':
      return t.responsable === 1;
    case 'f2':
      return t.responsable === 2;
    case 'entregables':
      return t.clase === 'entregable';
    case 'tareas':
      return t.clase === 'tarea';
    case 'obligaciones':
      return t.clase === 'obligacion';
  }
}
