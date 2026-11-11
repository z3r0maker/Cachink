import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, typography } from '@xangarro/tokens';

/** «¿Sin teléfono y sin códigos?» and its button, under a quiet rule. */
export const ayuda = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
  paddingTop: 16,
  borderTop: borders.quiet,
});

export const pregunta = style({
  flex: '1 1 180px',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** The way back sits at the card's left edge, not stretched like the actions above it. */
export const volver = style({ alignSelf: 'flex-start' });
