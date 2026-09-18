import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** Operador · Caja, catalogue half (`Operador Caja.dc.html`). */
export const WIDE = 'screen and (min-width: 1240px)';
export const NARROW = 'screen and (max-width: 1239px)';

export const layout = style({ display: 'flex', gap: 20, alignItems: 'flex-start' });
export const left = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const search = style({
  boxSizing: 'content-box',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  height: 50,
  padding: '0 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.white,
});

export const searchInput = style({
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
    padding: '0 17px',
    border: `2px solid ${colors.black}`,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    letterSpacing: '-0.01em',
    color: colors.black,
    selectors: {
      '&[aria-pressed="true"]': { background: colors.yellow, boxShadow: shadows.small },
    },
  },
]);

export const grid = style({
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  '@media': {
    [NARROW]: { gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' },
    [PHONE]: { gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))' },
  },
});

/** A 76 px tile: hover lifts, press stamps (the design's `data-tile`). */
export const tile = style({
  minHeight: 76,
  padding: '0 13px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  boxShadow: shadows.card,
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  color: colors.black,
  transitionProperty: 'transform, box-shadow',
  transitionDuration: '100ms',
  transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  selectors: {
    '&:hover': { transform: 'translate(-1px, -1px)', boxShadow: `5px 5px 0 ${colors.black}` },
    '&:active': { transform: 'translate(2px, 2px)', boxShadow: shadows.pressed },
  },
  '@media': { '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' } },
});

export const tileIcon = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 42,
  height: 42,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
  color: colors.black,
});

export const tileText = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
});

export const tileName = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.015em',
  lineHeight: 1.15,
  color: colors.black,
  textWrap: 'pretty',
});

export const low = style({
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 8px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
  color: colors.redText,
});

export const price = style({
  flex: 'none',
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const qty = style({
  flex: 'none',
  minWidth: 28,
  height: 28,
  padding: '0 7px',
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.ink,
});

export const nuevo = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.01em',
  color: colors.black,
  textWrap: 'pretty',
});
