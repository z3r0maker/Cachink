/**
 * When an idle caja pulls (DB3-CAJA-03, ADR-121 §3). Without a capture the
 * register used to pull never: a new price, a catalogue change, an operator's
 * new NIP or deactivation (NIPs are checked on the device) reached it only
 * with the next sale. Now it also pulls
 *
 *   - on boot;
 *   - when its tab comes back into view, unless it pulled in the last 45 s;
 *   - every 5 min ±20 % while the tab is visible (the jitter keeps a shop's
 *     cajas from pulling in step).
 *
 * The pull itself goes through the engine, so its backoff after a failure
 * still holds. Pure scheduling: the caller says what a pull is.
 */

export const INTERVALO_PULL_MS = 5 * 60_000;
const JITTER = 0.2;
/** A tab switch right after a pull does not pull again (the capture rule's 45 s). */
export const PULL_MIN_MS = 45_000;

/** The slice of `document` the scheduler needs; tests pass a fake. */
export interface Visibilidad {
  readonly visibilityState: DocumentVisibilityState;
  addEventListener(tipo: 'visibilitychange', fn: () => void): void;
  removeEventListener(tipo: 'visibilitychange', fn: () => void): void;
}

export interface EntornoPull {
  readonly doc: Visibilidad;
  readonly random?: () => number;
}

/** Start pulling; the returned function stops the timer and the listener. */
export function programarPulls(pull: () => void, entorno: EntornoPull): () => void {
  const { doc } = entorno;
  const random = entorno.random ?? Math.random;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let ultimo = Number.NEGATIVE_INFINITY;

  const tirar = (): void => {
    ultimo = Date.now();
    pull();
  };
  const desarmar = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const armar = (): void => {
    desarmar();
    if (doc.visibilityState !== 'visible') return;
    const espera = INTERVALO_PULL_MS * (1 - JITTER + 2 * JITTER * random());
    timer = setTimeout(() => {
      timer = null;
      tirar();
      armar();
    }, espera);
  };
  const alCambiar = (): void => {
    if (doc.visibilityState !== 'visible') {
      desarmar();
      return;
    }
    if (Date.now() - ultimo >= PULL_MIN_MS) tirar();
    armar();
  };

  doc.addEventListener('visibilitychange', alCambiar);
  tirar();
  armar();
  return () => {
    desarmar();
    doc.removeEventListener('visibilitychange', alCambiar);
  };
}
