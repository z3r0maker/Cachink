/**
 * When the animated splash leaves (MarcaSplashAnimado). The coin flips and
 * the «!» hops once in 0.7 s; a load that takes longer repeats the 1.1 s
 * cycle, and the splash leaves at the end of the first flip after the app
 * is ready, never in mid-turn. Reduce Motion skips the wait: it leaves as
 * soon as the app is ready. It never stays past `TOPE_MS`, whatever happens.
 */

/** One flip plus the «!» hop. */
export const PRIMERA_VUELTA_MS = 700;
/** The loop while the app is still loading. */
export const CICLO_MS = 1100;
/** The fade out (Reduce Motion: a shorter crossfade). */
export const SALIDA_MS = 280;
export const SALIDA_REDUCIDA_MS = 250;
/** Never trap anyone behind the splash. */
export const TOPE_MS = 6000;

/**
 * Milliseconds since mount at which the splash starts to leave, given when
 * the app became ready (`listoEnMs`, since mount).
 */
export function momentoDeSalida(listoEnMs: number, reducido: boolean): number {
  const listo = Math.max(0, listoEnMs);
  if (reducido) return Math.min(listo, TOPE_MS);
  if (listo <= PRIMERA_VUELTA_MS) return PRIMERA_VUELTA_MS;
  const vueltas = Math.ceil((listo - PRIMERA_VUELTA_MS) / CICLO_MS);
  return Math.min(PRIMERA_VUELTA_MS + vueltas * CICLO_MS, TOPE_MS);
}
