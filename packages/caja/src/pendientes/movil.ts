/**
 * The phone's «Registros por enviar» hero and its note (M-09; the web's
 * `heroe()` in `derive.ts` says «No cierres la pestaña», a browser's words).
 * Pure, so the tests pin every wording. The phases are the board's: en espera,
 * sin internet, enviando, todo enviado, con rechazados.
 */

import type { RegistroEnCola } from './types';
import { suman } from './derive';

/** The queue's one phase, as the phone sees it (the board's states). */
export type FaseCola = 'espera' | 'sin-internet' | 'enviando' | 'enviado' | 'con-rechazados';

export interface HeroeCola {
  readonly eyebrow: string;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly boton: string;
}

const cuenta = (n: number, uno: string, varios: string): string =>
  n === 1 ? `1 ${uno}` : `${n} ${varios}`;

/** The waiting hero: en espera online, or esperando conexión offline. */
function heroeEspera(sinInternet: boolean, cola: readonly RegistroEnCola[]): HeroeCola {
  return {
    eyebrow: sinInternet ? 'Sin conexión' : 'En espera',
    titulo: sinInternet
      ? cuenta(cola.length, 'registro espera conexión', 'registros esperan conexión')
      : cuenta(cola.length, 'registro por enviar', 'registros por enviar'),
    cuerpo:
      `${suman(cola)} Puedes seguir cobrando; se envían solos cuando vuelva el internet.`.trim(),
    boton: 'Reintentar envío',
  };
}

/** The hero of each phase; `rechazados` counts what the server refused. */
export function heroeTelefono(
  fase: FaseCola,
  cola: readonly RegistroEnCola[],
  rechazados: number,
  ultima: string | null,
): HeroeCola {
  if (fase === 'enviando') {
    const enviando = Math.max(cola.length, rechazados);
    return {
      eyebrow: 'Enviando',
      titulo: `Enviando ${cuenta(enviando, 'registro', 'registros')}…`,
      cuerpo: 'En cuanto suban, el turno se puede cerrar.',
      boton: 'Enviando…',
    };
  }
  if (fase === 'con-rechazados') {
    return {
      eyebrow: 'Revisar',
      titulo: `El servidor no aceptó ${cuenta(rechazados, 'registro', 'registros')}`,
      cuerpo:
        'Sigue en esta caja, no se pierde. Lee la razón de cada uno abajo y reintenta los que puedas.',
      boton: 'Reintentar envío',
    };
  }
  if (fase === 'enviado') {
    return {
      eyebrow: 'Al día',
      titulo: 'Todo enviado',
      cuerpo:
        ultima === null
          ? 'El último envío fue hace unos segundos.'
          : `El último envío fue a las ${ultima}.`,
      boton: 'Enviar de nuevo',
    };
  }
  return heroeEspera(fase === 'sin-internet', cola);
}

/** Don Cuentas' note under the queue: nothing is lost, and why the close waits. */
export const NOTA_NADA_SE_PIERDE = {
  titulo: 'Nada se pierde',
  cuerpo:
    'Lo que capturas vive en esta caja hasta que suba. No borres los datos de la app. No podrás cerrar el turno hasta que se envíe.',
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
