import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** Operador · Turno, from `Xangarro Portal - Operador Turno.dc.html`. */
const contentBox = { boxSizing: 'content-box' } as const;
const NARROW = 'screen and (max-width: 1179px)';

export const top = style({
  display: 'grid',
  gridTemplateColumns: '380px minmax(0, 1fr)',
  gap: 16,
  alignItems: 'start',
  '@media': { [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const right = style({ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 });

/* The yellow expected-cash card. */

export const hero = style({
  padding: 22,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.yellow,
  boxShadow: shadows.hero,
});

export const heroLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.black,
});

export const heroAmount = style({
  fontSize: portalFontSizes.hero,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tightest,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.displayLg } },
});

export const breakdown = style({ display: 'flex', flexDirection: 'column', gap: 9 });

export const breakdownRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  paddingBottom: 8,
  borderBottom: `2px solid ${colors.yellowRule}`,
});

export const breakdownLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const breakdownValue = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const heroCta = style([
  pressable,
  {
    ...contentBox,
    height: 54,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.white,
    boxShadow: shadows.card,
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    color: colors.black,
    textDecoration: 'none',
  },
]);
