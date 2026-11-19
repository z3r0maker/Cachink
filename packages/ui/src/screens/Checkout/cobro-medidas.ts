/**
 * The cobro's sizes per phone height (board MvCobroTotal). The total, the
 * methods and the cash row take these; the keypad gets what is left, between
 * `TECLA_MIN` and `TECLA_MAX` per row, so the whole screen fits without
 * scrolling from the iPhone SE up.
 */
import type { portalFontSizes } from '../../theme';

type Cifra = keyof typeof portalFontSizes;

export interface MedidasCobro {
  /** Above the total and below the keypad. */
  readonly margen: number;
  /** Between the screen's blocks. */
  readonly separacion: number;
  /** Height of the «Total a cobrar» block. */
  readonly total: number;
  readonly cifraTotal: Cifra;
  /** Height of the payment methods row. */
  readonly metodo: number;
  /** Height of the «Paga con» and change row. */
  readonly cuenta: number;
  readonly cifraCuenta: Cifra;
  /** Height of «Exacto» and the round bills. */
  readonly rapido: number;
  readonly separacionTeclas: number;
}

export const TECLA_MIN = 44;
export const TECLA_MAX = 64;

const COMPACTA: MedidasCobro = {
  margen: 6,
  separacion: 6,
  total: 76,
  cifraTotal: 'displayLg',
  metodo: 44,
  cuenta: 46,
  cifraCuenta: 'xl2',
  rapido: 44,
  separacionTeclas: 6,
};

const MEDIA: MedidasCobro = {
  margen: 10,
  separacion: 10,
  total: 92,
  cifraTotal: 'price',
  metodo: 52,
  cuenta: 60,
  cifraCuenta: 'xl4',
  rapido: 48,
  separacionTeclas: 8,
};

const AMPLIA: MedidasCobro = {
  margen: 12,
  separacion: 12,
  total: 112,
  cifraTotal: 'hero',
  metodo: 56,
  cuenta: 68,
  cifraCuenta: 'xl5',
  rapido: 52,
  separacionTeclas: 8,
};

export function medidasCobro(altoVentana: number): MedidasCobro {
  if (altoVentana < 740) return COMPACTA;
  return altoVentana < 900 ? MEDIA : AMPLIA;
}
