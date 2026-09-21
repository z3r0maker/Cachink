import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

export const pageTitle = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const pageSubtitle = style({
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const pagoRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 0',
  borderBottom: `1px solid ${colors.gray100}`,
});

export const pagoFecha = style({
  display: 'block',
  fontSize: portalFontSizes.xs,
  color: colors.gray600,
});

export const pagoMonto = style({
  marginLeft: 'auto',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
});
