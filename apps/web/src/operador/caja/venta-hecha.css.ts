import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';
import { toast as baseToast } from '../ui/toast.css';
import { NARROW } from './catalogo.css';

/**
 * «Venta registrada»: the shared toast, placed clear of the ticket column
 * (440 px from the right when wide) and above the bar and tab bar when narrow.
 */
export const card = style([
  baseToast,
  {
    right: 440,
    width: 'min(360px, calc(100vw - 32px))',
    '@media': {
      [NARROW]: { right: 16, bottom: 96 },
      [PHONE]: { bottom: 156 },
    },
  },
]);

export const method = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const body = style({ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 });

export const cambio = style({
  fontSize: portalFontSizes.display,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const nota = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

export const action = style([
  pressable,
  {
    flex: 1,
    height: 46,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[2],
    boxShadow: `3px 3px 0 ${colors.black}`,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.black,
  },
]);

export const track = style({ height: 6, background: colors.gray200 });
export const fill = style({
  height: '100%',
  background: colors.yellow,
  borderRight: `2px solid ${colors.black}`,
});
