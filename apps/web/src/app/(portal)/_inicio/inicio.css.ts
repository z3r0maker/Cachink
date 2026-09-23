import { style } from '@vanilla-extract/css';
import { colors, fontSizes, portalFontSizes, typography } from '@xangarro/tokens';

export const heroRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: 20,
  alignItems: 'start',
});

export const heroFigure = style({
  margin: '12px 0 0',
  fontSize: portalFontSizes.hero,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tightest,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const heroRange = style({
  marginTop: 10,
  fontSize: fontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

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

export const pageDate = style({
  // Inicio's page subtitle: «a 15px/600 --gray-600 subtitle 6px below» (S-4).
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
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

export const grid3 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
  alignItems: 'start',
});

export const lowStockCount = style({
  margin: '4px 0 12px',
  fontSize: portalFontSizes.display,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.redText,
});

export const heroEyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.black,
});
