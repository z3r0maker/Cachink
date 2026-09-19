import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, shapeRadii, typography } from '@xangarro/tokens';

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

export const cardGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 16,
});

export const avatar = style({
  width: 48,
  height: 48,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  background: colors.blueSoft,
  color: colors.blueText,
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
});

export const cardHead = style({ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' });

export const statBoxes = style({ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' });

export const statBox = style({
  flex: '1 1 120px',
  padding: 12,
  background: colors.offwhite,
  border: `2px solid ${colors.black}`,
  borderRadius: 12,
});

export const statLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const statValue = style({
  marginTop: 4,
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const cardFoot = style({
  marginTop: 14,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

/** The pairing code: eight characters in white boxes on the flat-yellow panel. */
export const codeRow = style({ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' });

export const codeBox = style({
  width: 44,
  height: 56,
  display: 'grid',
  placeItems: 'center',
  background: colors.white,
  border: `2.5px solid ${colors.black}`,
  borderRadius: 12,
  boxShadow: `3px 3px 0 ${colors.black}`,
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
});

export const cardName = style({
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const panelTitle = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const enviadoLine = style({
  margin: '10px 0 0',
  fontWeight: 600,
});
