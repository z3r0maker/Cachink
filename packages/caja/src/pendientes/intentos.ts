/**
 * Registros por enviar while the engine retries (DS-05, DS-07): the helper
 * line per cause, what the hero says after a manual retry, and each retrying
 * row's gray second line «Último intento: hace 3 min · Próximo: en 2 min».
 * Pure: the caller passes the clock and the engine's last retry.
 */

import type { CausaReintento, Reintento } from '../comun/envio';
import { enMinutos, haceTiempo, horaDelDia } from '../comun/tiempo';
import type { RegistroEnCola } from './types';

/** The hero's bold line: why nothing went yet, and that it goes by itself. */
export function ayudaReintento(r: Reintento | null): string {
  const AYUDA: Readonly<Record<Exclude<CausaReintento, 'esperar'>, string>> = {
    ocupado: 'El servidor está ocupado; reintentamos solos.',
    lenta: 'La conexión está lenta; reintentamos solos.',
  };
  if (r === null || r.causa === null) return '';
  // «7:42 p. m.» already ends the sentence.
  if (r.causa === 'esperar') return `El servidor pidió esperar hasta las ${horaDelDia(r.en)}`;
  return AYUDA[r.causa];
}

/** After «Reintentar envío» found the server still unwilling. It skips our wait, never the server's. */
export function despuesDeReintentar(r: Reintento | null): string {
  if (r?.causa === 'esperar')
    return `Lo enviamos a las ${horaDelDia(r.en)}, como pidió el servidor.`;
  return 'Todavía no se pudo. Lo volvemos a intentar solos en un momento.';
}

const aMs = (iso: string | null | undefined): number | null => {
  if (iso === null || iso === undefined) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
};

/**
 * `@xangarro/sync`'s `STALE_PENDING_MS`: a row still `pending` reports its
 * next attempt as the stale sweep ten minutes after it was sent. That is a
 * ceiling, not the plan: its batch failed as a whole, the push cursor stayed
 * behind it, and it goes again with the engine's next run.
 */
const BARRIDO_PENDIENTE_MS = 10 * 60_000;

/** The row's own next time; a pending row's sweep gives way when the engine waits. */
function propiaDe(r: RegistroEnCola, ultimo: number, motorEspera: boolean): number | null {
  const propia = aMs(r.proximoIntento);
  return motorEspera && propia === ultimo + BARRIDO_PENDIENTE_MS ? null : propia;
}

/** «Próximo: …»: the row's own backoff, or the engine's wait when that is later or the row just waits for it. */
function proximo(
  r: RegistroEnCola,
  ultimo: number,
  motor: Reintento | null,
  ahora: number,
): string | null {
  const espera = motor !== null && motor.en > ahora ? motor : null;
  const fila = propiaDe(r, ultimo, espera !== null);
  if (fila === null && espera === null) return null;
  const manda = espera !== null && espera.en >= (fila ?? 0);
  const en = manda ? espera.en : (fila as number);
  if (manda && espera.causa === 'esperar') return `Próximo: a las ${horaDelDia(en)}`;
  return en <= ahora ? 'Próximo: en un momento' : `Próximo: ${enMinutos(en - ahora)}`;
}

/** The gray second line of a row in retry; null for a row never tried. */
export function lineaIntento(
  r: RegistroEnCola,
  ahora: number,
  motor: Reintento | null = null,
): string | null {
  const ultimo = aMs(r.ultimoIntento);
  if (r.reintento !== true || ultimo === null) return null;
  const siguiente = proximo(r, ultimo, motor, ahora);
  const hace = `Último intento: ${haceTiempo(ahora - ultimo)}`;
  return siguiente === null ? hace : `${hace} · ${siguiente}`;
}
