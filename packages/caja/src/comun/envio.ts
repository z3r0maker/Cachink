/**
 * The sync pill (DS-05), one wording for the web caja's header and the
 * phone's: en línea · enviando · reintentando · sin conexión · con rechazos.
 * «Reintentando» counts down to the engine's `retryAt` («Reintentando en
 * 1 min»), or names the hour when the server set Retry-After («Reintentando a
 * las 7:42 p. m.»). Pure: the caller passes the clock and the last run.
 */

import { enMinutos, horaDelDia } from './tiempo';

/** Why the engine waits: busy server (429/5xx), slow connection (timeout), or the server said when. */
export type CausaReintento = 'ocupado' | 'lenta' | 'esperar';

/** A run's failure as `@xangarro/sync` reports it (`SyncError`). */
export interface FalloEnvio {
  readonly code: string;
  readonly status: number;
  readonly retryAfterMs?: number;
}

/** When the engine goes again by itself (epoch ms), and why; `causa` null for any other failure. */
export interface Reintento {
  readonly en: number;
  readonly causa: CausaReintento | null;
}

export interface LecturaFallo {
  /** The request never reached the server (`NETWORK`). */
  readonly sinRed: boolean;
  readonly reintento: Reintento | null;
}

export function causaDe(f: FalloEnvio): CausaReintento | null {
  if (f.retryAfterMs !== undefined) return 'esperar';
  if (f.code === 'TIMEOUT') return 'lenta';
  if (f.status === 429 || f.status >= 500) return 'ocupado';
  return null;
}

/** A run's result read for the pill: offline, or when and why it retries. */
export function leerFallo(r: {
  readonly retryAt?: string | null;
  readonly error: FalloEnvio | null;
}): LecturaFallo {
  if (r.error?.code === 'NETWORK') return { sinRed: true, reintento: null };
  const en = r.retryAt ? Date.parse(r.retryAt) : Number.NaN;
  if (Number.isNaN(en)) return { sinRed: false, reintento: null };
  return { sinRed: false, reintento: { en, causa: r.error === null ? null : causaDe(r.error) } };
}

export type EstadoPill =
  | 'en-linea'
  | 'por-enviar'
  | 'enviando'
  | 'reintentando'
  | 'sin-conexion'
  | 'con-rechazos';

export interface EntradaPill {
  readonly enLinea: boolean;
  readonly enviando: boolean;
  /** Everything not accepted yet (`unsentRows`). */
  readonly pendientes: number;
  /** Refused for good: they wait for a person. */
  readonly rechazados: number;
  readonly reintento: Reintento | null;
  readonly ahora: number;
}

export interface PillEnvio {
  readonly estado: EstadoPill;
  /** The caja's header, wide. */
  readonly etiqueta: string;
  /** A narrow header: the phone, the caja on a phone. */
  readonly corta: string;
  readonly aria: string;
}

/** A retry the pill should count down to: records wait and the time is still ahead. */
export function reintentoVigente(e: EntradaPill): Reintento | null {
  return e.pendientes > 0 && e.reintento !== null && e.reintento.en > e.ahora ? e.reintento : null;
}

export function estadoPill(e: EntradaPill): EstadoPill {
  if (e.enviando && e.pendientes > 0) return 'enviando';
  if (!e.enLinea) return 'sin-conexion';
  if (e.rechazados > 0) return 'con-rechazos';
  if (reintentoVigente(e) !== null) return 'reintentando';
  return e.pendientes > 0 ? 'por-enviar' : 'en-linea';
}

const registros = (n: number): string => (n === 1 ? '1 registro' : `${n} registros`);

function textos(estado: EstadoPill, e: EntradaPill): { etiqueta: string; corta: string } {
  const n = e.pendientes;
  switch (estado) {
    case 'enviando':
      return { etiqueta: `Enviando ${registros(n)}`, corta: 'Enviando…' };
    case 'sin-conexion':
      return n > 0
        ? { etiqueta: `Sin conexión · ${n} sin enviar`, corta: `${n} sin enviar` }
        : { etiqueta: 'Sin conexión', corta: 'Sin conexión' };
    case 'con-rechazos': {
      const t = e.rechazados === 1 ? '1 rechazado' : `${e.rechazados} rechazados`;
      return { etiqueta: t, corta: t };
    }
    case 'reintentando': {
      const r = reintentoVigente(e) as Reintento;
      if (r.causa === 'esperar') {
        const hora = horaDelDia(r.en);
        return { etiqueta: `Reintentando a las ${hora}`, corta: `Reintento: ${hora}` };
      }
      const t = `Reintentando ${enMinutos(r.en - e.ahora)}`;
      return { etiqueta: t, corta: t };
    }
    case 'por-enviar':
      return { etiqueta: `${n} sin enviar`, corta: `${n} sin enviar` };
    default:
      return { etiqueta: 'Todo enviado', corta: 'Enviado' };
  }
}

export function pillEnvio(e: EntradaPill): PillEnvio {
  const estado = estadoPill(e);
  const t = textos(estado, e);
  return { estado, ...t, aria: `Estado del envío: ${t.etiqueta}` };
}
