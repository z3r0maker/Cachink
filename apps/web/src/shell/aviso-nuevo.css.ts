import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

export const franja = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  margin: '16px 36px 0',
  padding: '10px 12px 10px 16px',
  borderRadius: radii[3],
  background: colors.yellowSoft,
  border: borders.thin,
});

export const texto = style({
  flex: '1 1 260px',
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const boton = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: 40,
  padding: '0 14px',
  borderRadius: radii[1],
  border: borders.thin,
  background: colors.white,
  boxShadow: shadows.small,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'none',
});
