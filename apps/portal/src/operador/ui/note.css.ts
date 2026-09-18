import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The «i» note boxes the operator screens use for rules and consequences. */
export const note = style({
  display: 'flex',
  gap: 11,
  padding: '13px 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
});

export const text = style({
  fontSize: portalFontSizes.sm,
  color: colors.black,
  textWrap: 'pretty',
});

export const glyph = style({ flex: 'none', marginTop: 1, color: colors.black, display: 'grid' });

export const strong = style({ fontWeight: typography.weights.extraBold });
