import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** OpAcceso: who is at the counter, then their NIP on a big keypad. */

export const operadores = style({ display: 'flex', flexDirection: 'column', gap: 8 });

export const operador = style([
  pressable,
  {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    height: 60,
    padding: '0 14px',
    border: borders.quiet,
    borderRadius: radii[4],
    background: colors.white,
    fontFamily: 'inherit',
    textAlign: 'left',
    selectors: {
      '&[aria-checked="true"]': {
        border: borders.thick,
        background: colors.yellowSoft,
        boxShadow: shadows.small,
      },
    },
  },
]);

export const avatar = style({
  width: 40,
  height: 40,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nombre = style({
  flex: 1,
  minWidth: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nipHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const nipLabel = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nipHint = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const dots = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 18,
  height: 28,
});

export const dot = style({
  width: 22,
  height: 22,
  border: borders.thick,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  selectors: { '&[data-lleno="true"]': { background: colors.black } },
});

export const keypad = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
  '@media': { [PHONE]: { gap: 10 } },
});

export const key = style([
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
    fontSize: portalFontSizes.xl4,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: 'tabular-nums',
    color: colors.black,
    '@media': { [PHONE]: { height: 60 } },
  },
]);

export const keyBorrar = style({ background: colors.gray100, fontSize: portalFontSizes.body });

export const keyEntrar = style({
  border: borders.thick,
  background: colors.yellow,
  fontSize: portalFontSizes.lgx,
  selectors: {
    '&:disabled': {
      opacity: 1,
      border: borders.quiet,
      background: colors.yellowSoft,
      boxShadow: 'none',
      color: colors.textMuted,
    },
  },
});

export const ayuda = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  textAlign: 'center',
});

export const ayudaBoton = style({
  minHeight: 44,
  padding: '0 8px',
  border: 'none',
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
});

export const ayudaTexto = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
