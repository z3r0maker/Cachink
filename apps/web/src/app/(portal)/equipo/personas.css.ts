import { style } from '@vanilla-extract/css';
import { borders, colors, fontSizes, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** Equipo y nómina (ADR-107): the payroll line on a person's card, and payroll-only cards. */
export const nomina = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 12,
  padding: '10px 12px',
  background: colors.offwhite,
  borderRadius: radii[2],
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
});

export const nominaSub = style({ fontWeight: typography.weights.semibold, color: colors.gray600 });

export const empuja = style({ marginLeft: 'auto' });

export const seccion = style({
  margin: '28px 0 12px',
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const tarjeta = style({
  display: 'grid',
  gap: 10,
  padding: 20,
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[5],
});

export const cabeza = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const nombre = style({
  display: 'grid',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
});
