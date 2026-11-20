import type { Carpeta } from '../expediente/index.js';
import { vigentes } from '../expediente/index.js';
import { ContadorError } from './errors.js';

/**
 * What goes in the contador's package (E-43, board CD-10d), and its name. It
 * comes out of a month that has ended: «preliminar» while the month is open,
 * built from what there is that day; «final» once it is closed. Pure.
 */
export type TipoPaquete = 'final' | 'preliminar';

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

export function assertMesTerminado(mes: string, hoy: string): void {
  if (!MES.test(mes)) throw new ContadorError('PAQUETE_MES', mes);
  if (mes >= hoy.slice(0, 7)) throw new ContadorError('PAQUETE_SIN_TERMINAR', mes);
}

export const nombreDelPaquete = (mes: string, tipo: TipoPaquete): string =>
  `mexia-${mes}-${tipo}.zip`;

export const nombreDeLaBalanza = (mes: string): string => `balanza-${mes}.csv`;

/** The fields of an Expediente document the package decides by. */
export interface DocumentoDelMes {
  readonly id: string;
  readonly periodo: string | null;
  readonly carpeta: Carpeta;
  readonly obligacionId: string | null;
  readonly entryId: string | null;
  readonly reemplazaA: string | null;
}

/**
 * The month's acuses and comprobantes: the current version of each
 * obligation's evidence (acuse, línea de captura, comprobante de pago) and of
 * each statement filed for the month without a movement (the bank's). A
 * received invoice's XML, tied to its movement, goes in `recibidas/` instead.
 */
export function comprobantesDelMes<T extends DocumentoDelMes>(
  docs: readonly T[],
  mes: string,
): T[] {
  return vigentes(docs)
    .map((v) => v.doc)
    .filter(
      (d) =>
        d.periodo === mes &&
        (d.obligacionId !== null || (d.carpeta === 'comprobantes' && d.entryId === null)),
    );
}

/** Only letters, digits and a few marks survive, and never a leading dot. */
const seguro = (nombre: string): string =>
  nombre
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/^[.\s]+/, '')
    .slice(0, 120) || 'archivo';

function unico(nombre: string, vistos: Set<string>): string {
  if (!vistos.has(nombre)) return nombre;
  const punto = nombre.lastIndexOf('.');
  const [base, ext] = punto > 0 ? [nombre.slice(0, punto), nombre.slice(punto)] : [nombre, ''];
  for (let n = 2; ; n++) {
    const otro = `${base} (${n})${ext}`;
    if (!vistos.has(otro)) return otro;
  }
}

/** Each file's path in its folder: no separators or dots that climb, and no two alike. */
export function rutasDelPaquete(carpeta: string, nombres: readonly string[]): string[] {
  const vistos = new Set<string>();
  return nombres.map((n) => {
    const nombre = unico(seguro(n), vistos);
    vistos.add(nombre);
    return `${carpeta}/${nombre}`;
  });
}
