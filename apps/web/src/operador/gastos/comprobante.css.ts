import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** The receipt: take a photo, attached (tap removes), or recorded as missing. */
export const tarjeta = style([
  pressable,
  {
    width: '100%',
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    border: borders.quiet,
    borderRadius: radii[4],
    background: colors.offwhite,
    fontFamily: 'inherit',
    textAlign: 'left',
    color: colors.black,
    selectors: {
      '&[data-adjunto]': { border: `2px solid ${colors.greenText}`, background: colors.greenSoft },
    },
  },
]);

export const sin = style({
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 14,
  border: `2px solid ${colors.warningText}`,
  borderRadius: radii[4],
  background: colors.warningSoft,
});

export const icono = style({
  flex: 'none',
  width: 48,
  height: 48,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
});

export const titulo = style({
  display: 'block',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const hint = style({
  display: 'block',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const link = style({
  alignSelf: 'flex-start',
  height: 44,
  padding: '0 4px',
  border: 0,
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
});

export const quiet = style([
  pressable,
  {
    height: 44,
    padding: '0 12px',
    border: borders.quiet,
    borderRadius: radii[2],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
]);
