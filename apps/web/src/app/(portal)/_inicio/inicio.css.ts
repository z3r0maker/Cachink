import { style } from '@vanilla-extract/css';
import { colors, fontSizes, typography } from '@xangarro/tokens';

export const sectionTitle = style({
  margin: 0,
  fontSize: fontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const pageTitle = style({
  margin: 0,
  fontSize: fontSizes.xl6,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const listRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 0',
  borderBottom: `2px solid ${colors.gray200}`,
  selectors: { '&:last-child': { borderBottom: 0 } },
});

export const badge = style({
  width: 36,
  height: 36,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 9999,
  border: `2px solid ${colors.black}`,
  fontWeight: typography.weights.extraBold,
});

export const rowMeta = style({
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const rowAmount = style({
  marginLeft: 'auto',
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

export const amountPositive = style({ color: colors.greenText });
export const amountNegative = style({ color: colors.redText });
