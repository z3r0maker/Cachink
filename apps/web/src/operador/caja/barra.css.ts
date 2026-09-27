import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';
import { NARROW } from './catalogo.css';

/** Below 1240 px, with the sheet closed: the black bar with the total and «Cobrar». */
export const bar = style({
  display: 'none',
  position: 'fixed',
  left: 272,
  right: 24,
  bottom: 20,
  maxWidth: 560,
  margin: '0 auto',
  zIndex: 45,
  boxSizing: 'border-box',
  height: 64,
  padding: '0 8px 0 16px',
  alignItems: 'center',
  gap: 10,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.black,
  color: colors.white,
  '@media': {
    [NARROW]: { selectors: { '&[data-show]': { display: 'flex' } } },
    [PHONE]: { left: 12, right: 12, bottom: 76 },
  },
});

export const resumen = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  fontVariantNumeric: 'tabular-nums',
});

export const piezas = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray200,
  whiteSpace: 'nowrap',
});

export const total = style({
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.white,
});

export const vacio = style({
  flex: 1,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray200,
});

export const vaciar = style([
  pressable,
  {
    flex: 'none',
    width: 44,
    height: 44,
    display: 'grid',
    placeItems: 'center',
    border: `2px solid ${colors.gray600}`,
    borderRadius: radii[2],
    background: 'none',
    color: colors.gray200,
    cursor: 'pointer',
  },
]);

export const cobrar = style([
  pressable,
  {
    flex: 'none',
    height: 48,
    padding: '0 20px',
    border: `2px solid ${colors.yellow}`,
    borderRadius: radii[2],
    background: colors.yellow,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.lg,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    cursor: 'pointer',
    selectors: {
      '&:disabled': {
        borderColor: colors.gray600,
        background: colors.gray600,
        color: colors.gray400,
        cursor: 'default',
      },
    },
  },
]);
