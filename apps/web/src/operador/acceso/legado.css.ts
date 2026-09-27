import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/**
 * The door's previous classes, kept because the lock screen (`caja/bloqueo*`)
 * still borrows them. Remove once the lock moves to its own board (OpBloqueo).
 */

export const card = style({
  width: 'min(440px, 100%)',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: 26,
  border: borders.thick,
  borderRadius: radii[6],
  background: colors.white,
  boxShadow: shadows.card,
});

export const paso = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const title = style({
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const body = style({
  fontSize: portalFontSizes.sm,
  lineHeight: 1.5,
  color: colors.ink,
});

export const error = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.red,
});

export const operadorRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '10px 12px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  selectors: {
    '&[aria-pressed="true"]': { background: colors.yellow, boxShadow: shadows.small },
  },
});

export const initials = style({
  display: 'grid',
  placeItems: 'center',
  width: 38,
  height: 38,
  flex: 'none',
  borderRadius: shapeRadii.pill,
  border: borders.thin,
  background: colors.blueSoft,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
});

export const nipBoxes = style({
  display: 'flex',
  gap: 10,
  justifyContent: 'center',
});

export const nipBox = style({
  width: 52,
  height: 58,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'ui-monospace, monospace',
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const keypad = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
});

export const key = style({
  height: 52,
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});
