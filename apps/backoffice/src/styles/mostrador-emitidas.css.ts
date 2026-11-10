import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Facturas › Emitidas (E-10, board CD-06i): the strip with the month's
 * «Público en general» global, and the CFDI cell's note and inbox link.
 */
export const global = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 16,
  padding: '16px 20px',
  border: borders.thin,
  borderRadius: radii[4],
  background: colors.white,
});

export const globalTexto = style({
  flex: '1 1 360px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const globalTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
});

export const globalDetalle = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const cfdi = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 4,
});

export const nota = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
