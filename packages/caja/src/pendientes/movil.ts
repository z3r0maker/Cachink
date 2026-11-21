/**
 * The phone's «Registros por enviar» status line, footer and note (M-09,
 * RvEnvio; the web's `heroe()` in `derive.ts` says «No cierres la pestaña», a
 * browser's words). Pure, so the tests pin every wording. The phases are the
 * board's: en espera, sin internet, enviando, todo enviado, con rechazados.
 */

import type { RegistroEnCola } from './types';

/** The queue's one phase, as the phone sees it (the board's states). */
export type FaseCola = 'espera' | 'sin-internet' | 'enviando' | 'enviado' | 'con-rechazados';

/**
 * The phone's status line and its one footer button (RvEnvio): the line says
 * how many wait and that they send themselves; refused rows say why on their
 * own card, so they get no line. The footer is the only retry on the screen.
 */
export interface PieCola {
  readonly aviso: string | null;
  readonly boton: string;
  /** True while it sends: the button holds. */
  readonly ocupado: boolean;
}

const cuenta = (n: number, uno: string, varios: string): string =>
  n === 1 ? `1 ${uno}` : `${n} ${varios}`;

const SOLOS = 'Puedes seguir cobrando; se envían solos.';

export function pieCola(fase: FaseCola, cola: readonly RegistroEnCola[]): PieCola {
  const n = cola.length;
  if (fase === 'enviando') {
    // The turno closes with rows still to send (ADR-123): never «wait».
    const aviso = `Enviando ${cuenta(n, 'registro', 'registros')}… Puedes seguir cobrando y cerrar el turno mientras suben.`;
    return { aviso, boton: 'Enviando…', ocupado: true };
  }
  if (fase === 'con-rechazados') return { aviso: null, boton: 'Reintentar', ocupado: false };
  const cuantos =
    fase === 'sin-internet'
      ? cuenta(n, 'registro espera conexión', 'registros esperan conexión')
      : cuenta(n, 'registro por enviar', 'registros por enviar');
  return { aviso: `${cuantos}. ${SOLOS}`, boton: 'Reintentar ahora', ocupado: false };
}

/**
 * Don Cuentas' note under the queue (RvEnvio): nothing is lost, and the turno
 * closes with rows still to send, as Cierre says (R3, ADR-123).
 */
export const NOTA_NADA_SE_PIERDE = {
  titulo: 'Nada se pierde',
  cuerpo: 'Puedes cerrar el turno; se envían cuando vuelva la conexión.',
} as const;

/** The sync run's phase, as the bridge reports it (`CloudSyncPhase`). */
export type FaseSincronia = 'idle' | 'syncing' | 'offline' | 'error';

/**
 * The queue's one phase from what the device knows: a send in flight wins,
 * then what the server refused (it needs a person), then no internet, then
 * the wait; an empty quiet queue is «todo enviado». The pill reads the same
 * order (`pillView`), so the hero never contradicts it.
 */
export function faseTelefono(
  sincronia: FaseSincronia,
  esperando: number,
  rechazados: number,
): FaseCola {
  if (sincronia === 'syncing') return 'enviando';
  if (rechazados > 0) return 'con-rechazados';
  if (sincronia === 'offline') return 'sin-internet';
  return esperando > 0 ? 'espera' : 'enviado';
}

/**
 * The queue with nothing left to send (RvEnvio «Todo enviado»): Don and «los
 * patrones», who already have it. `ultima` is the last send's «HH:MM», or
 * null right after one.
 */
export function todoEnviado(ultima: string | null): {
  readonly titulo: string;
  readonly cuerpo: string;
} {
  const cuando = ultima === null ? 'hace unos segundos' : `a las ${ultima}`;
  return {
    titulo: 'Todo está enviado',
    cuerpo: `Los patrones ya tienen lo que capturaste. Última vez ${cuando}.`,
  };
}
