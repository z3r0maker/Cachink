import type { DatosDelTablero } from '@xangarro/application/corp';
import { formatMoneyEntero } from '@xangarro/domain';
import {
  estadoDelPlan,
  nombreTrimestre,
  otroSocio,
  resumenDelTrimestre,
  trimestreDe,
  type EventoTarjeta,
  type Socio,
  type TarjetaEnTrimestre,
} from '@xangarro/domain/corp';

import { fechaCorta } from './fechas';
import type { Nombres } from './socios-view';
import { lineaDeEstado, type Tono } from './tablero-tarjeta-vista';

/**
 * A card's drawer in board CD-13c's words (E-20): its criterion, both values
 * and the one used, what this partner may do now, and its history.
 */
export interface Acciones {
  readonly proponer: boolean;
  readonly cotizar: boolean;
  readonly quitar: boolean;
  readonly iniciar: boolean;
  readonly terminar: boolean;
  readonly hacer: boolean;
  readonly revisar: boolean;
  readonly mediador: boolean;
  readonly resolver: boolean;
}

export interface CajonTarjeta {
  readonly id: string;
  readonly eyebrow: string;
  readonly titulo: string;
  readonly sub: string;
  readonly estado: string | null;
  readonly tono: Tono;
  readonly entregable: boolean;
  readonly criterio: string;
  readonly valores: string;
  readonly valorNota: string | null;
  readonly plazo: string | null;
  readonly evidencia: { readonly href: string; readonly externo: boolean } | null;
  readonly acciones: Acciones;
  readonly historia: readonly {
    readonly quien: string;
    readonly cuando: string;
    readonly texto: string;
  }[];
}

const TEXTO: Record<EventoTarjeta['tipo'], (e: EventoTarjeta) => string> = {
  iniciada: () => 'La empezó.',
  terminada: (e) =>
    e.documentoId === null
      ? 'La marcó terminada, con un enlace.'
      : 'La marcó terminada, con un archivo.',
  aceptada: () => 'La aceptó.',
  objetada: (e) => `Objetó: «${e.motivo ?? ''}»`,
  al_mediador: (e) => `La llevó al mediador: «${e.motivo ?? ''}»`,
  resuelta: (e) =>
    e.aceptada === true
      ? 'Registró que el mediador la aceptó.'
      : 'Registró que el mediador no la aceptó.',
  hecha: () => 'La marcó hecha.',
};

function valoresDe(t: TarjetaEnTrimestre, n: Nombres): string {
  const c = t.tarjeta;
  if (c.tipo === 'tarea') return 'Una tarea no lleva valor.';
  const v = (x: bigint | null) => (x === null ? 'falta' : formatMoneyEntero(x));
  const base = `${n[1]} propuso ${v(c.valores[1])} · ${n[2]}, ${v(c.valores[2])}`;
  if (t.valor.fuente === 'cotizacion')
    return `${base} · cotización de un tercero: ${v(c.cotizacion)}`;
  if (t.valor.fuente === 'promedio') return `${base} · se usa el promedio: ${v(t.valor.valor)}`;
  return base;
}

function evidenciaDe(t: TarjetaEnTrimestre) {
  const ev = [...t.tarjeta.eventos].reverse().find((e) => e.tipo === 'terminada');
  if (ev === undefined) return null;
  if (ev.documentoId !== null)
    return { href: `/empresa/documentos/${ev.documentoId}`, externo: false };
  return ev.enlace === null ? null : { href: ev.enlace, externo: true };
}

type Fase = TarjetaEnTrimestre['estado']['fase'];
const una = (f: Fase, ...fases: readonly Fase[]) => fases.includes(f);

/** What the value asks for: a partner's proposal, the quote, leaving the plan. */
function deValor(t: TarjetaEnTrimestre, congelada: boolean, planAbierto: boolean) {
  const porHacer = t.estado.fase === 'por_hacer';
  return {
    proponer:
      t.tarjeta.tipo === 'entregable' && porHacer && !congelada && t.valor.fuente !== 'cotizacion',
    cotizar: porHacer && t.valor.fuente === 'cotizacion_requerida',
    quitar: porHacer && planAbierto,
  };
}

/** The moves: the owner's, the reviewer's, either's with the mediator. */
function deMovimiento(t: TarjetaEnTrimestre, yo: Socio, hoy: string) {
  const f = t.estado.fase;
  const mio = t.tarjeta.responsable === yo;
  const entregable = t.tarjeta.tipo === 'entregable';
  const empezo = trimestreDe(hoy) >= t.tarjeta.trimestre;
  const puede = empezo && mio && (!entregable || t.valor.valor !== null);
  return {
    iniciar: puede && f === 'por_hacer',
    terminar: puede && entregable && una(f, 'por_hacer', 'en_curso', 'objetada'),
    hacer: puede && !entregable && una(f, 'por_hacer', 'en_curso'),
    revisar: !mio && f === 'en_revision',
    mediador: f === 'objetada' && t.estado.mediadorNo === null,
    resolver: f === 'al_mediador',
  };
}

function notaDeValor(t: TarjetaEnTrimestre, congelada: boolean): string | null {
  if (congelada) return 'Congelado desde que se aprobó el plan.';
  if (t.valor.fuente !== 'cotizacion_requerida') return null;
  return 'Difieren más del doble: la tarjeta no tiene valor ni puede empezar hasta que haya una cotización.';
}

function plazoDe(t: TarjetaEnTrimestre, nombres: Nombres): string | null {
  const plazo = t.estado.plazo;
  if (t.estado.fase !== 'en_revision' || plazo === null) return null;
  return `${nombres[otroSocio(t.tarjeta.responsable)]} tiene hasta el ${fechaCorta(plazo)} para objetar. Si no objeta, queda aceptado.`;
}

export function cajonDe(
  datos: DatosDelTablero,
  id: string,
  trimestre: string,
  yo: Socio,
  nombres: Nombres,
  hoy: string,
): CajonTarjeta | null {
  const r = resumenDelTrimestre({ trimestre, tarjetas: datos.tarjetas, planes: datos.planes, hoy });
  const t = r.tarjetas.find((x) => x.tarjeta.id === id);
  if (t === undefined) return null;
  const c = t.tarjeta;
  const congelada =
    estadoDelPlan(datos.planes, c.trimestre).fase === 'aprobado' && t.valor.valor !== null;
  const planAbierto = r.plan.fase !== 'aprobado' && hoy <= r.limitePlan;
  return {
    id,
    eyebrow: `Tablero · ${nombreTrimestre(trimestre)}`,
    titulo: c.titulo,
    sub: `${nombres[c.responsable]} · vence el ${fechaCorta(c.vence)}`,
    ...lineaDeEstado(t, (s) => nombres[s]),
    entregable: c.tipo === 'entregable',
    criterio: c.criterio,
    valores: valoresDe(t, nombres),
    valorNota: notaDeValor(t, congelada),
    plazo: plazoDe(t, nombres),
    evidencia: evidenciaDe(t),
    acciones: { ...deValor(t, congelada, planAbierto), ...deMovimiento(t, yo, hoy) },
    historia: c.eventos.map((e) => ({
      quien: nombres[e.socio],
      cuando: fechaCorta(e.fecha),
      texto: TEXTO[e.tipo](e),
    })),
  };
}
