/**
 * The escáner's camera contract (MvEscaner), shared by the platform files:
 * `escaner-camara.native.tsx` (expo-camera, with the torch) and
 * `escaner-camara.tsx` (web and tests, no camera: the code is typed).
 */
export interface EscanerCamaraProps {
  /** The torch; only a phone has one. */
  readonly luz: boolean;
  /** False while the unknown-code card waits; a held code is read once either way (`leerCodigo`). */
  readonly activo: boolean;
  readonly onCodigo: (codigo: string) => void;
}

/**
 * The same code in view keeps firing; it counts again only after it has been
 * out of view this many ms.
 */
export const REPETIDO_MS = 1500;

/** The last code the camera saw, and when. */
export interface Lectura {
  readonly codigo: string;
  readonly visto: number;
}

/**
 * One sighting of `codigo` at `ahora` (ms). It counts when it is a new code,
 * or the same code after a gap of `REPETIDO_MS`. Every sighting refreshes the
 * window, so a barcode held in front of the camera adds its product once.
 */
export function leerCodigo(
  prev: Lectura | null,
  codigo: string,
  ahora: number,
): { readonly cuenta: boolean; readonly siguiente: Lectura } {
  const cuenta = prev === null || prev.codigo !== codigo || ahora - prev.visto >= REPETIDO_MS;
  return { cuenta, siguiente: { codigo, visto: ahora } };
}
