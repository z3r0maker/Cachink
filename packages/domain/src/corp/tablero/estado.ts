import { sumarDias } from '../../dates/periodo.js';
import type { IsoDate } from '../../dates/index.js';
import { trimestreDe } from '../socios/dinero.js';
import type { EventoTarjeta, Tarjeta } from './tipos.js';

/**
 * A card's state, read from its events (OD-4 §3). «Terminado» opens a window
 * of ten calendar days; the other partner accepts or objects inside it, and
 * silence accepts on its last day. An objection names the unmet part; the
 * owner marks it again (ten new days) or either takes it to the mediator,
 * whose ruling is recorded. An accepted card counts in the quarter it was
 * last finished in.
 */
export const PLAZO_OBJECION_DIAS = 10;

export type Fase =
  'por_hacer' | 'en_curso' | 'en_revision' | 'objetada' | 'al_mediador' | 'aceptada' | 'hecha';

export interface EstadoTarjeta {
  readonly fase: Fase;
  /** The last «terminado». */
  readonly terminadaEl: string | null;
  /** The last day to object, while in review. */
  readonly plazo: string | null;
  readonly aceptadaEl: string | null;
  readonly como: 'silencio' | 'el_otro' | 'mediador' | null;
  readonly objecion: { readonly fecha: string; readonly motivo: string } | null;
  /** The day the mediator did not accept it, while it stays objected. */
  readonly mediadorNo: string | null;
  /** The quarter it counts in, once accepted or done. */
  readonly cuentaEn: string | null;
}

export const plazoDeObjecion = (terminada: string): string =>
  sumarDias(terminada as IsoDate, PLAZO_OBJECION_DIAS);

const INICIAL: EstadoTarjeta = {
  fase: 'por_hacer',
  terminadaEl: null,
  plazo: null,
  aceptadaEl: null,
  como: null,
  objecion: null,
  mediadorNo: null,
  cuentaEn: null,
};

const FINAL: ReadonlySet<Fase> = new Set(['aceptada', 'hecha']);

function aceptar(e: EstadoTarjeta, el: string, como: EstadoTarjeta['como']): EstadoTarjeta {
  const cuentaEn = e.terminadaEl === null ? null : trimestreDe(e.terminadaEl);
  return { ...e, fase: 'aceptada', plazo: null, aceptadaEl: el, como, cuentaEn };
}

/** Silence accepts once the day after the window arrives. */
function porSilencio(e: EstadoTarjeta, dia: string): EstadoTarjeta {
  if (e.fase !== 'en_revision' || e.plazo === null || dia <= e.plazo) return e;
  return aceptar(e, e.plazo, 'silencio');
}

type Paso = (e: EstadoTarjeta, ev: EventoTarjeta) => EstadoTarjeta;

const objetar: Paso = (e, ev) => ({
  ...e,
  fase: 'objetada',
  plazo: null,
  objecion: { fecha: ev.fecha, motivo: ev.motivo ?? '' },
});

const resolver: Paso = (e, ev) =>
  ev.aceptada === true
    ? aceptar(e, ev.fecha, 'mediador')
    : { ...e, fase: 'objetada', mediadorNo: ev.fecha };

/** Each event, and the phase it applies in (any, when none is named). */
const PASOS: Record<EventoTarjeta['tipo'], { readonly desde: Fase | null; readonly paso: Paso }> = {
  iniciada: { desde: 'por_hacer', paso: (e) => ({ ...e, fase: 'en_curso' }) },
  terminada: {
    desde: null,
    paso: (e, ev) => ({
      ...e,
      fase: 'en_revision',
      terminadaEl: ev.fecha,
      plazo: plazoDeObjecion(ev.fecha),
      mediadorNo: null,
    }),
  },
  aceptada: { desde: 'en_revision', paso: (e, ev) => aceptar(e, ev.fecha, 'el_otro') },
  objetada: { desde: 'en_revision', paso: objetar },
  al_mediador: { desde: 'objetada', paso: (e) => ({ ...e, fase: 'al_mediador' }) },
  resuelta: { desde: 'al_mediador', paso: resolver },
  hecha: {
    desde: null,
    paso: (e, ev) => ({
      ...e,
      fase: 'hecha',
      aceptadaEl: ev.fecha,
      cuentaEn: trimestreDe(ev.fecha),
    }),
  },
};

function aplicar(e: EstadoTarjeta, ev: EventoTarjeta): EstadoTarjeta {
  const { desde, paso } = PASOS[ev.tipo];
  return desde === null || desde === e.fase ? paso(e, ev) : e;
}

export function estadoDeTarjeta(t: Pick<Tarjeta, 'eventos'>, hoy: string): EstadoTarjeta {
  let e = INICIAL;
  for (const ev of t.eventos) {
    e = porSilencio(e, ev.fecha);
    if (FINAL.has(e.fase)) break;
    e = aplicar(e, ev);
  }
  return porSilencio(e, hoy);
}
