import type { IsoDate } from '../../dates/index.js';
import { formatDate } from '../../format/date.js';
import type { Socio } from '../ledger/movements.js';
import { nombreTrimestre, trimestreDe } from '../socios/dinero.js';
import { TableroError } from './errors.js';
import { estadoDeTarjeta, type EstadoTarjeta, type Fase } from './estado.js';
import { otroSocio, type EventoTarjeta, type Tarjeta, type TipoEvento } from './tipos.js';
import { valorDeTarjeta } from './valor.js';

/**
 * What a partner may do to a card (OD-4 §3), as the event it records. The
 * owner starts and finishes; the other partner accepts or objects inside the
 * window; either takes an objection to the mediator and records the ruling.
 */
export type Accion =
  | 'iniciar'
  | 'terminar'
  | 'aceptar'
  | 'objetar'
  | 'mediador'
  | 'resolver'
  | 'hacer';

export interface Movimiento {
  readonly accion: Accion;
  readonly socio: Socio;
  readonly hoy: string;
  readonly enlace: string | null;
  readonly documentoId: string | null;
  readonly motivo: string | null;
  readonly aceptada: boolean | null;
}

interface Regla {
  readonly tipo: TipoEvento;
  readonly fases: readonly Fase[];
  readonly quien: 'responsable' | 'el_otro' | 'cualquiera';
  readonly de: 'entregable' | 'tarea' | 'ambos';
}

const REGLAS: Record<Accion, Regla> = {
  iniciar: { tipo: 'iniciada', fases: ['por_hacer'], quien: 'responsable', de: 'ambos' },
  terminar: {
    tipo: 'terminada',
    fases: ['por_hacer', 'en_curso', 'objetada'],
    quien: 'responsable',
    de: 'entregable',
  },
  aceptar: { tipo: 'aceptada', fases: ['en_revision'], quien: 'el_otro', de: 'entregable' },
  objetar: { tipo: 'objetada', fases: ['en_revision'], quien: 'el_otro', de: 'entregable' },
  mediador: { tipo: 'al_mediador', fases: ['objetada'], quien: 'cualquiera', de: 'entregable' },
  resolver: { tipo: 'resuelta', fases: ['al_mediador'], quien: 'cualquiera', de: 'entregable' },
  hacer: { tipo: 'hecha', fases: ['por_hacer', 'en_curso'], quien: 'responsable', de: 'tarea' },
};

const URL = /^https?:\/\/[^\s]+\.[^\s]+$/;

const limpio = (s: string | null): string | null => {
  const t = s?.trim() ?? '';
  return t === '' ? null : t;
};

function assertQuien(r: Regla, t: Tarjeta, socio: Socio): void {
  if (r.quien === 'responsable' && socio !== t.responsable) {
    throw new TableroError('SOLO_RESPONSABLE', String(t.responsable));
  }
  if (r.quien === 'el_otro' && socio === t.responsable) {
    throw new TableroError('SOLO_EL_OTRO', String(otroSocio(t.responsable)));
  }
}

function assertFase(r: Regla, t: Tarjeta, e: EstadoTarjeta): void {
  if (r.de !== 'ambos' && r.de !== t.tipo) throw new TableroError('TARJETA_ESTADO');
  if (r.fases.includes(e.fase)) return;
  const tarde = r.quien === 'el_otro' && e.como === 'silencio' && e.aceptadaEl !== null;
  if (tarde) throw new TableroError('PLAZO_VENCIDO', formatDate(e.aceptadaEl as IsoDate));
  throw new TableroError('TARJETA_ESTADO');
}

type Detalle = Pick<EventoTarjeta, 'enlace' | 'documentoId' | 'motivo' | 'aceptada'>;

const NADA: Detalle = { enlace: null, documentoId: null, motivo: null, aceptada: null };

function conValor(t: Tarjeta): void {
  if (t.tipo === 'entregable' && valorDeTarjeta(t).valor === null) {
    throw new TableroError('TARJETA_SIN_VALOR');
  }
}

function evidencia(m: Movimiento, t: Tarjeta): Detalle {
  conValor(t);
  const enlace = limpio(m.enlace);
  const documentoId = limpio(m.documentoId);
  if (documentoId !== null) return { ...NADA, documentoId };
  if (enlace === null || !URL.test(enlace)) throw new TableroError('EVIDENCIA');
  return { ...NADA, enlace };
}

function motivo(m: Movimiento): Detalle {
  const texto = limpio(m.motivo);
  if (texto === null) throw new TableroError('MOTIVO');
  return { ...NADA, motivo: texto };
}

function resolucion(m: Movimiento): Detalle {
  const documentoId = limpio(m.documentoId);
  if (documentoId === null || m.aceptada === null) throw new TableroError('MEDIADOR_DOCUMENTO');
  return { ...NADA, documentoId, aceptada: m.aceptada };
}

/** The extra each action asks for: evidence, a reason, the mediator's document. */
const DETALLES: Record<Accion, (m: Movimiento, t: Tarjeta) => Detalle> = {
  iniciar: (_m, t) => {
    conValor(t);
    return NADA;
  },
  terminar: evidencia,
  aceptar: () => NADA,
  objetar: motivo,
  mediador: motivo,
  resolver: resolucion,
  hacer: () => NADA,
};

export function eventoDeMovimiento(t: Tarjeta, m: Movimiento): EventoTarjeta {
  if (t.descartadaEn !== null && trimestreDe(m.hoy) >= t.descartadaEn) {
    throw new TableroError('TARJETA_DESCARTADA');
  }
  if (trimestreDe(m.hoy) < t.trimestre) {
    throw new TableroError('TARJETA_AUN_NO', nombreTrimestre(t.trimestre));
  }
  const r = REGLAS[m.accion];
  assertFase(r, t, estadoDeTarjeta(t, m.hoy));
  assertQuien(r, t, m.socio);
  return { tipo: r.tipo, socio: m.socio, fecha: m.hoy, ...DETALLES[m.accion](m, t) };
}
