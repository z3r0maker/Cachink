import { style } from '@vanilla-extract/css';
import {
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** The in-place reply to the corte, and the in-list empty card. */
export const replied = style({
  padding: '14px 16px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.greenSoft,
});

export const repliedText = style({
  marginTop: 5,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

export const reply = style({ display: 'flex', flexDirection: 'column', gap: 10 });

export const input = style({
  width: '100%',
  height: 54,
  padding: '0 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  selectors: { '&:focus': { borderWidth: 2.5 } },
});

export const suggestions = style({ display: 'flex', gap: 9, flexWrap: 'wrap' });

export const suggestion = style([
  pressable,
  {
    boxSizing: 'content-box',
    display: 'inline-flex',
    alignItems: 'center',
    height: 40,
    padding: '0 14px',
    border: `2px solid ${colors.black}`,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
]);

export const empty = style({
  padding: '48px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 11,
  textAlign: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.white,
  boxShadow: shadows.hero,
});

export const emptyTile = style({
  boxSizing: 'content-box',
  width: 58,
  height: 58,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.greenSoft,
  color: colors.greenText,
});

export const emptyTitle = style({
  fontSize: fontSizes.xl,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const emptyBody = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});
