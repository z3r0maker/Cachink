import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/* The NIP: dots, the keypad, the error line. */
export const nipHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nipAyuda = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const puntos = style({
  height: 28,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 18,
});

export const punto = style({
  boxSizing: 'border-box',
  width: 22,
  height: 22,
  border: borders.thick,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  selectors: { '&[data-lleno]': { background: colors.black } },
});

export const error = style({
  margin: 0,
  textAlign: 'center',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.redText,
});

export const teclado = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
});

export const tecla = style([
  pressable,
  {
    height: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: borders.thin,
    borderRadius: radii[5],
    background: colors.white,
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.xl6,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: 'tabular-nums',
    color: colors.black,
    '@media': {
      'screen and (max-height: 760px)': { height: 60 },
      'screen and (max-width: 420px)': {
        selectors: { '&[data-entrar], &[data-borrar]': { fontSize: portalFontSizes.sm } },
      },
    },
    selectors: {
      '&[data-borrar]': { background: colors.gray100, fontSize: portalFontSizes.body },
      '&[data-entrar]': {
        border: borders.thick,
        background: colors.yellow,
        fontSize: portalFontSizes.body,
        lineHeight: 1.15,
        textAlign: 'center',
      },
      '&[data-entrar]:disabled': {
        opacity: 1,
        border: borders.quiet,
        background: colors.yellowSoft,
        boxShadow: 'none',
        color: colors.textMuted,
      },
    },
  },
]);
