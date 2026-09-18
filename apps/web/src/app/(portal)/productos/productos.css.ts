import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

export const pageTitle = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const pageSubtitle = style({
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const productCell = style({ display: 'flex', alignItems: 'center', gap: 12 });

/** Initial tile, coloured by category. */
export const tile = style({
  width: 34,
  height: 34,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  fontWeight: typography.weights.extraBold,
  fontSize: portalFontSizes.md,
});

export const sku = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

/** The 12 px existence bar: green above the threshold, red below. */
export const stockBar = style({
  height: 12,
  width: 96,
  background: colors.gray100,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[0],
  overflow: 'hidden',
});

export const stockFill = style({ display: 'block', height: '100%' });

export const stockLabel = style({
  marginTop: 4,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  fontVariantNumeric: 'tabular-nums',
});

export const toolbar = style({ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' });
