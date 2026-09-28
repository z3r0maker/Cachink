import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

/** Productos › Movimientos' footer (DS-04): what is listed, and the way to all of it. */
export const pie = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const exportarTodos = style({
  minHeight: 44,
  padding: '0 4px',
  border: 0,
  background: 'none',
  fontFamily: typography.fontFamily,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
  selectors: {
    '&:disabled': { color: colors.textMuted, textDecoration: 'none', cursor: 'default' },
  },
});
