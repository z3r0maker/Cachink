import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** «Platícanos de ti»'s intro (ADR-107): what Don Cuentas is about to ask. */

/** The intro's «what I'll ask you» list: numbered, two columns on a wide screen. */
export const temario = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 10,
  maxWidth: 820,
});

export const tema = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[3],
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
});

export const temaNum = style({
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  width: 28,
  height: 28,
  borderRadius: shapeRadii.pill,
  border: borders.thin,
  background: colors.yellow,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const introActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 16,
});
