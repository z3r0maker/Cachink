import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** Form pieces shared by the operator modals: label, 50 px text field, choice chips. */
export const label = style({
  display: 'block',
  marginBottom: 5,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const text = style({
  width: '100%',
  height: 50,
  padding: '0 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  selectors: { '&:focus': { borderWidth: 2.5 } },
});

/** Motivo / categoría chips: no shadow, no stamp; yellow when chosen. */
export const choice = style({
  boxSizing: 'content-box',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 15px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  selectors: { '&[aria-pressed="true"]': { background: colors.yellow } },
});
