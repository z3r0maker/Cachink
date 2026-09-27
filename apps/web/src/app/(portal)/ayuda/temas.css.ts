import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, shapeRadii, typography } from '@xangarro/tokens';

/** A topic: a quiet pill; black with yellow once chosen, like every filter. */
export const temaChip = style({
  minHeight: 44,
  padding: '0 16px',
  border: borders.quiet,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  font: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  cursor: 'pointer',
  selectors: {
    '&:hover': { borderColor: colors.black },
    '&[aria-pressed="true"]': {
      background: colors.black,
      borderColor: colors.black,
      color: colors.yellow,
      fontWeight: typography.weights.extraBold,
    },
  },
});

export const verTodas = style({
  justifySelf: 'start',
  marginTop: 12,
  minHeight: 44,
  padding: '0 4px',
  border: 0,
  background: 'none',
  font: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'underline',
  cursor: 'pointer',
});
