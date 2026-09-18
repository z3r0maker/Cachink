import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';
import { NARROW } from './catalogo.css';

/** Ticket foot buttons, its empty state, and the narrow-band «Cobrar» bar. */
const button = {
  height: 54,
  fontFamily: 'inherit',
  fontWeight: typography.weights.bold,
  textTransform: 'uppercase',
  color: colors.black,
} as const;

export const vaciar = style([
  pressable,
  {
    ...button,
    flex: 'none',
    padding: '0 16px',
    border: `2px solid ${colors.black}`,
    borderRadius: radii[2],
    background: colors.white,
    boxShadow: shadows.small,
    fontSize: portalFontSizes.xs,
    letterSpacing: typography.letterSpacing.wider,
  },
]);

export const cobrar = style([
  pressable,
  {
    ...button,
    flex: 1,
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontSize: portalFontSizes.md,
    letterSpacing: typography.letterSpacing.widest,
    selectors: {
      '&:hover:not(:disabled)': { background: colors.yellowDeep },
      '&:disabled': { background: colors.gray100 },
    },
  },
]);

export const empty = style({
  padding: '34px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  textAlign: 'center',
});

export const emptyTile = style({
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

export const emptyTitle = style({
  fontSize: portalFontSizes.lgx,
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

/** Below 1240 px, with items and the sheet closed: the yellow bar that opens it. */
export const bar = style({
  display: 'none',
  position: 'fixed',
  left: 272,
  right: 24,
  bottom: 20,
  maxWidth: 520,
  margin: '0 auto',
  zIndex: 45,
  height: 64,
  padding: '0 18px',
  alignItems: 'center',
  gap: 14,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.yellow,
  boxShadow: shadows.card,
  cursor: 'pointer',
  fontFamily: 'inherit',
  color: colors.black,
  '@media': {
    [NARROW]: { selectors: { '&[data-show]': { display: 'flex' } } },
    [PHONE]: { left: 8, right: 8, bottom: 80 },
  },
});

export const barCount = style({
  minWidth: 34,
  height: 34,
  padding: '0 9px',
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const barLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
});

export const barTotal = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
});
