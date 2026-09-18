import { style } from '@vanilla-extract/css';
import { colors, fontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Inputs have a border and **no** shadow — a shadow would make them read as
 * cards. On focus the border thickens to 2.5 px rather than changing colour.
 */
export const field = style({
  width: '100%',
  height: 52,
  boxSizing: 'border-box',
  padding: '0 14px',
  background: colors.offwhite,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  fontFamily: typography.fontFamily,
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  selectors: {
    '&:focus': { borderWidth: 2.5, outline: 'none', background: colors.white },
    '&::placeholder': { color: colors.textMuted },
    '&[aria-invalid="true"]': { borderWidth: 2.5, borderColor: colors.red },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

/** Every input has a visible label; placeholder-only labelling is forbidden. */
export const label = style({
  display: 'block',
  marginBottom: 5,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const hint = style({
  marginTop: 6,
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const errorText = style({
  marginTop: 6,
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.redText,
});

export const fieldGroup = style({ marginBottom: 14 });

/** Money is right-aligned with tabular numerals so columns line up. */
export const money = style({ textAlign: 'right', fontVariantNumeric: 'tabular-nums' });
