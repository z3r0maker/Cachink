import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

/** The foot of the Clásico, Moderno and Minimal sheets. */
export const pie = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  paddingTop: 10,
  borderTopWidth: 2,
  borderTopStyle: 'solid',
  textAlign: 'center',
});

export const leyenda = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const whatsapp = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const fiscal = style({
  marginTop: 4,
  fontSize: portalFontSizes.tag,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
