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

/** «Vaciar» sits quietly in the ticket's head, away from Cobrar. */
export const vaciarChico = style([
  pressable,
  {
    marginLeft: 'auto',
    height: 40,
    padding: '0 14px',
    border: `2px solid ${colors.gray200}`,
    borderRadius: radii[1],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
    cursor: 'pointer',
  },
]);

export const cobrar = style([
  pressable,
  {
    ...button,
    width: '100%',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontWeight: typography.weights.extraBold,
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[4],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontSize: portalFontSizes.xl,
    textTransform: 'none',
    letterSpacing: '-0.01em',
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

export const cobrarDetalle = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

/** The keyboard shortcuts, said once and quietly; phones never see them. */
export const atajos = style({
  margin: 0,
  textAlign: 'center',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  '@media': { [NARROW]: { display: 'none' } },
});
