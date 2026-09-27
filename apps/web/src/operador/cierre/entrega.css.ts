import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** «¿Ya le diste $2,710.00 a Pedro?»: the centered confirmation over the scrim. */
export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  display: 'grid',
  placeItems: 'center',
  padding: 16,
  background: colors.scrim,
});

export const card = style({
  width: '100%',
  maxWidth: 480,
  boxSizing: 'border-box',
  padding: '22px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.white,
  boxShadow: `6px 6px 0 ${colors.black}`,
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const cerrar = style([
  pressable,
  {
    flex: 'none',
    width: 44,
    height: 44,
    display: 'grid',
    placeItems: 'center',
    border: borders.quiet,
    borderRadius: radii[2],
    background: colors.white,
    color: colors.ink,
  },
]);

export const texto = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

const boton = {
  height: 52,
  borderRadius: radii[3],
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
} as const;

export const si = style([
  pressable,
  {
    ...boton,
    flex: 1,
    border: borders.thick,
    background: colors.yellow,
    boxShadow: `3px 3px 0 ${colors.black}`,
  },
]);

export const no = style([
  pressable,
  { ...boton, padding: '0 18px', border: borders.thin, background: colors.white },
]);
