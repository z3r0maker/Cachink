/**
 * How the caja names the owner (plan 11 §3.3): the first name the bootstrap
 * and every pull send («Pedro Ramírez» → «Pedro»), with the title the owner
 * goes by kept («Don Pepe», never «Don»), or «el dueño» while the caja
 * doesn't know it (an older server, or an owner who set no name).
 */

export const DUENO_GENERICO = 'el dueño';

/** Titles a Mexican owner goes by, compared lower-case and without the dot. */
const TITULOS: ReadonlySet<string> = new Set([
  'don',
  'doña',
  'sr',
  'sra',
  'srta',
  'lic',
  'ing',
  'dr',
  'dra',
  'prof',
  'profa',
  'mtro',
  'mtra',
]);

const esTitulo = (palabra: string): boolean =>
  TITULOS.has(palabra.toLocaleLowerCase('es-MX').replace(/\.$/, ''));

export function nombreDueno(nombre: string | null | undefined): string {
  const palabras = (nombre ?? '').trim().split(/\s+/).filter(Boolean);
  const [primera, segunda] = palabras;
  if (primera === undefined) return DUENO_GENERICO;
  return segunda !== undefined && esTitulo(primera) ? `${primera} ${segunda}` : primera;
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
