/**
 * Contrast for the receipt templates (N-20). One accent colour per
 * comprobante, one ink decision per comprobante — the rule every ficha
 * repeats: relative luminance over 0.45 takes dark ink, under takes white.
 * Applied to every tinted block alike, never one yes and one no.
 */

const UMBRAL = 0.45;
export const TINTA_OSCURA = '#0D0D0D' as const;
export const TINTA_CLARA = '#FFFFFF' as const;

function canal(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a #RRGGBB (or #RGB) colour, 0…1. */
export function luminanciaRelativa(hex: string): number {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    throw new Error(`color no válido para luminancia: ${hex}`);
  }
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/**
 * The ink every tinted block of the comprobante uses over `acento`:
 * dark on light accents (#FFD60A → #0D0D0D), white on dark ones
 * (#14532D → #FFFFFF). Minimal never tints text, so it never calls this.
 */
export function tintaSobre(acento: string): '#0D0D0D' | '#FFFFFF' {
  return luminanciaRelativa(acento) > UMBRAL ? TINTA_OSCURA : TINTA_CLARA;
}
