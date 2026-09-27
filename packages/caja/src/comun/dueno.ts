/**
 * How the caja names the owner (plan 11 §3.3): the first name the bootstrap
 * and every pull send («Pedro Ramírez» → «Pedro»), or «el dueño» while the
 * caja doesn't know it (an older server, or an owner who set no name).
 */

export const DUENO_GENERICO = 'el dueño';

export function nombreDueno(nombre: string | null | undefined): string {
  const primero = (nombre ?? '').trim().split(/\s+/)[0] ?? '';
  return primero === '' ? DUENO_GENERICO : primero;
}

/** The first name, or null when unknown (Pendientes says «el portal del dueño»). */
export const primerNombreDueno = (nombre: string | null | undefined): string | null => {
  const n = nombreDueno(nombre);
  return n === DUENO_GENERICO ? null : n;
};

/** «de Pedro» / «del dueño». */
export const deDueno = (dueno: string): string =>
  dueno.startsWith('el ') ? `del ${dueno.slice(3)}` : `de ${dueno}`;

/** «a Pedro» / «al dueño». */
export const aDueno = (dueno: string): string =>
  dueno.startsWith('el ') ? `al ${dueno.slice(3)}` : `a ${dueno}`;

/** The sentence-initial form: «El dueño ya tiene tu respuesta». */
export const mayuscula = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
