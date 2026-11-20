/**
 * A barcode reader typing on the page (P-44, board EcPortalCodigo): a USB or
 * Bluetooth reader is a keyboard that types a code in a burst and ends it with
 * Enter. Outside any field, that burst is a code for «Código de barras»; a
 * person typing is far slower between keys, so their keys never add up to one.
 */

/** Longest gap between two of a reader's keys, in ms; a person is slower. */
export const RAFAGA_MS = 50;

/** Shortest code a reader sends (EAN-8); fewer keys are a person's. */
export const MIN_CODIGO = 8;

/** The characters a barcode carries: digits, Code 39's letters and signs. */
const CARACTER = /^[0-9A-Za-z\-. $/+%]$/;

export interface Rafaga {
  readonly texto: string;
  /** When the last key of the burst came, ms. */
  readonly ultima: number;
}

export const SIN_RAFAGA: Rafaga = { texto: '', ultima: 0 };

/**
 * One key at `ahora`. Returns the burst so far and, on an Enter that ends a
 * fast enough burst of at least `MIN_CODIGO` characters, the code it typed.
 */
export function lectorTecla(
  r: Rafaga,
  tecla: string,
  ahora: number,
): { readonly rafaga: Rafaga; readonly codigo: string | null } {
  const seguida = r.texto !== '' && ahora - r.ultima <= RAFAGA_MS;
  if (tecla === 'Enter') {
    const codigo = seguida && r.texto.length >= MIN_CODIGO ? r.texto : null;
    return { rafaga: SIN_RAFAGA, codigo };
  }
  // A reader presses Shift for each capital letter: it neither adds nor breaks the burst.
  if (tecla === 'Shift') return { rafaga: r, codigo: null };
  if (!CARACTER.test(tecla)) return { rafaga: SIN_RAFAGA, codigo: null };
  return { rafaga: { texto: (seguida ? r.texto : '') + tecla, ultima: ahora }, codigo: null };
}
