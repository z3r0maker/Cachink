import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** Apariencia's photo block (P-42): the photo large on its tint, beside what it is. */
const fila = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: 14,
  borderRadius: radii[5],
} as const;

export const bloque = style({ ...fila, border: borders.quiet });

/** No photo: the quiet edge on the soft fill (borders are never dashed, `borders`). */
export const vacio = style({ ...fila, border: borders.quiet, background: colors.offwhite });

export const cuadro = style({
  width: 112,
  height: 112,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  border: borders.thin,
  borderRadius: radii[6],
});

export const texto = style({
  display: 'grid',
  gap: 6,
  minWidth: 0,
  justifyItems: 'start',
});

export const titulo = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
});

export const fecha = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  fontVariantNumeric: 'tabular-nums',
});

export const nota = style({
  fontSize: portalFontSizes.sm,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});
