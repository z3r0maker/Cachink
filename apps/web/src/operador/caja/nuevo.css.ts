import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

const field = {
  width: '100%',
  height: 50,
  padding: '0 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  color: colors.ink,
  selectors: { '&:focus': { borderWidth: 2.5 } },
} as const;

export const input = style({
  ...field,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.semibold,
});

export const price = style({
  ...field,
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const cat = style({
  boxSizing: 'content-box',
  display: 'inline-flex',
  alignItems: 'center',
  height: 40,
  padding: '0 15px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  selectors: { '&[aria-pressed="true"]': { background: colors.yellow } },
});

const button = {
  height: 50,
  borderRadius: radii[2],
  fontFamily: 'inherit',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.black,
} as const;

export const cancel = style([
  pressable,
  {
    ...button,
    flex: 'none',
    padding: '0 18px',
    border: `2px solid ${colors.black}`,
    background: colors.white,
    boxShadow: shadows.small,
  },
]);

export const add = style([
  pressable,
  {
    ...button,
    flex: 1,
    border: `2.5px solid ${colors.black}`,
    background: colors.yellow,
    boxShadow: shadows.card,
    selectors: { '&:hover:not(:disabled)': { background: colors.yellowDeep } },
  },
]);
