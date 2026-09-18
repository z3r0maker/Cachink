import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** Cobrar: the 760 px modal — ticket summary left, the step right. */
export const grid = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'grid',
  gridTemplateColumns: '260px minmax(0, 1fr)',
  alignItems: 'stretch',
  '@media': { [PHONE]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const resumen = style({
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  borderRight: `2px solid ${colors.gray200}`,
  background: colors.gray100,
  '@media': { [PHONE]: { display: 'none' } },
});

export const resumenLines = style({ display: 'flex', flexDirection: 'column', gap: 8 });
export const resumenLine = style({ display: 'flex', alignItems: 'baseline', gap: 10 });

export const resumenQty = style({
  flex: 'none',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const resumenName = style({
  flex: 1,
  minWidth: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

export const resumenAmount = style({
  flex: 'none',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const resumenTotal = style({
  marginTop: 'auto',
  paddingTop: 12,
  borderTop: `2px solid ${colors.black}`,
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
});

export const figure = style({
  marginLeft: 'auto',
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const step = style({
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  minWidth: 0,
});

export const methods = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
});

export const method = style([
  pressable,
  {
    boxSizing: 'content-box',
    minHeight: 64,
    padding: '0 15px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    textAlign: 'left',
    color: colors.black,
  },
]);

export const methodIcon = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 38,
  height: 38,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  background: colors.white,
  color: colors.black,
});

export const methodLabel = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  textWrap: 'pretty',
});

/** The big yellow confirm at the foot of each step (58 px, a native button). */
export const confirm = style([
  pressable,
  {
    height: 58,
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    color: colors.black,
    selectors: {
      '&:hover:not(:disabled)': { background: colors.yellowDeep },
      '&:disabled': { background: colors.gray100 },
    },
  },
]);

export const back = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  background: colors.white,
  cursor: 'pointer',
  color: colors.black,
});
