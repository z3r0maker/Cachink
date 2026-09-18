import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** Search + filter chips of the list screens (Ventas, Gastos, Inventario, Cobranza). */
export const bar = style({ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' });

export const search = style({
  boxSizing: 'content-box',
  flex: 1,
  minWidth: 240,
  height: 50,
  padding: '0 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.white,
});

export const input = style({
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const chips = style({ display: 'flex', gap: 8, flexWrap: 'wrap' });

export const chip = style([
  pressable,
  {
    boxSizing: 'content-box',
    display: 'inline-flex',
    alignItems: 'center',
    height: 42,
    padding: '0 16px',
    border: `2px solid ${colors.black}`,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    selectors: {
      '&[aria-pressed="true"]': { background: colors.yellow, boxShadow: shadows.small },
    },
  },
]);

export const none = style({
  padding: '40px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  textAlign: 'center',
});

export const noneTile = style({
  boxSizing: 'content-box',
  width: 56,
  height: 56,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.yellowSoft,
  color: colors.black,
});

export const noneTitle = style({
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const noneBody = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});
