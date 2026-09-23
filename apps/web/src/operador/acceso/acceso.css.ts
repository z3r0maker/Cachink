import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** Operador · Acceso (O-12) — the full-page gate: vincular, NIP, fondo. */

export const page = style({
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: colors.yellowSoft,
});

export const card = style({
  width: 'min(440px, 100%)',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: 26,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[6],
  background: colors.white,
  boxShadow: `4px 4px 0 ${colors.black}`,
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

export const code = style({
  width: '100%',
  height: 58,
  padding: '0 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  fontFamily: 'ui-monospace, monospace',
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.28em',
  textAlign: 'center',
  textTransform: 'uppercase',
  color: colors.ink,
});

export const hint = style({
  fontSize: portalFontSizes.xs,
  color: colors.gray600,
});

export const error = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.red,
});

/** The operator picker: initials disc + name, the open row ringed in yellow. */
export const operadorRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '10px 12px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.white,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  selectors: {
    '&[aria-pressed="true"]': { background: colors.yellow, boxShadow: `3px 3px 0 ${colors.black}` },
  },
});

export const initials = style({
  display: 'grid',
  placeItems: 'center',
  width: 38,
  height: 38,
  flex: 'none',
  borderRadius: shapeRadii.pill,
  border: `2px solid ${colors.black}`,
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
  border: `2px solid ${colors.black}`,
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
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const quick = style({
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
});

export const quickChip = style({
  padding: '8px 12px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.blueSoft,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});
