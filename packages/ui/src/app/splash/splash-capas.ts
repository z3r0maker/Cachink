/**
 * Where the animated splash's layers sit, in the 426 × 923 board units the
 * native splash (`assets/brand/splash-mobile.png`, 852 × 1846) was rendered
 * from. The same layout produced the PNG and these boxes, so the overlay
 * lands on the native splash pixel for pixel. Both are drawn «cover»: scaled
 * to fill the screen and centred, the edges cropped.
 */
export const LIENZO = { w: 426, h: 923 } as const;
/** The coin (`moneda.png`, 564 px at 3x). */
export const MONEDA = { x: 118.984375, y: 300.5, w: 188, h: 188 } as const;
/** The «!» of «XANGARRO!» (`exclamacion.png`, 39 × 174 px at 3x). */
export const EXCLAMACION = { x: 321.25, y: 510.5, w: 13, h: 58 } as const;

export interface Caja {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** A board box on a `pantalla`-sized screen, scaled and centred like «cover». */
export function aPantalla(
  box: { x: number; y: number; w: number; h: number },
  pantalla: { width: number; height: number },
): Caja {
  const s = Math.max(pantalla.width / LIENZO.w, pantalla.height / LIENZO.h);
  const ox = (pantalla.width - LIENZO.w * s) / 2;
  const oy = (pantalla.height - LIENZO.h * s) / 2;
  return { left: ox + box.x * s, top: oy + box.y * s, width: box.w * s, height: box.h * s };
}
