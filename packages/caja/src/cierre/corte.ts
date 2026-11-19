/**
 * The day on the closed turno's corte («14 may»), shared by the phone and the
 * web caja. The rest of the closed screen's words live in `copy.ts` and
 * `patrones.ts`.
 */

/** «14 may», the day the turno closed. */
export function fechaCorta(d: Date = new Date()): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
}
