import { style, styleVariants } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, shapeRadii, typography } from '@xangarro/tokens';

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

export const planName = style({
  fontSize: portalFontSizes.displayLg,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tightest,
  color: colors.black,
});

export const planGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 16,
  alignItems: 'start',
});

/** The emphasis card is black with a yellow shadow; the rest are white. */
export const planCard = styleVariants({
  plain: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    background: colors.white,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[5],
    boxShadow: shadows.card,
    padding: 26,
  },
  emphasis: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    background: colors.black,
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[5],
    boxShadow: `5px 5px 0 ${colors.yellow}`,
    padding: 26,
  },
});

export const planBadge = style({
  position: 'absolute',
  top: -16,
  left: 26,
  display: 'inline-flex',
  alignItems: 'center',
  height: 30,
  padding: '0 14px',
  background: colors.yellow,
  border: `2.5px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  boxShadow: shadows.small,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.black,
  whiteSpace: 'nowrap',
});

export const priceRow = style({ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 18 });

export const priceSymbol = style({
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  lineHeight: 1.3,
});

export const priceValue = style({
  fontSize: portalFontSizes.price,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tightest,
  fontVariantNumeric: 'tabular-nums',
});

export const featureRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  marginTop: 11,
});

export const featureMark = style({ flex: 'none', width: 18, marginTop: 2, fontWeight: 800 });

export const usageLabel = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 7,
  fontWeight: typography.weights.bold,
});
