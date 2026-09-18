import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

/** The segmented tabs of Avisos and Inventario: 50 px, yellow when selected, a count pill each. */
export const tabs = style({
  display: 'inline-flex',
  alignSelf: 'flex-start',
  overflow: 'hidden',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.white,
  boxShadow: shadows.card,
});

export const tab = style({
  display: 'flex',
  alignItems: 'center',
  height: 50,
  padding: '0 20px',
  border: 'none',
  borderLeft: `2px solid ${colors.black}`,
  background: colors.white,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.black,
  selectors: {
    '&:first-child': { borderLeft: 'none' },
    '&[aria-selected="true"]': { background: colors.yellow },
  },
});

export const count = style({
  display: 'inline-flex',
  alignItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  selectors: { '[aria-selected="true"] &': { background: colors.white } },
});
