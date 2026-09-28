/**
 * The escáner's camera contract (MvEscaner), shared by the platform files:
 * `escaner-camara.native.tsx` (expo-camera, with the torch) and
 * `escaner-camara.tsx` (web and tests, no camera: the code is typed).
 */
export interface EscanerCamaraProps {
  /** The torch; only a phone has one. */
  readonly luz: boolean;
  /** False while a result card waits, so a code in view is not read twice. */
  readonly activo: boolean;
  readonly onCodigo: (codigo: string) => void;
}

/** The same code in view keeps firing; one read per this many ms. */
export const REPETIDO_MS = 1500;
