import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

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

export const channelRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1fr) 120px 120px 150px',
  gap: 12,
  alignItems: 'center',
  padding: '14px 0',
  borderBottom: `2px solid ${colors.gray200}`,
});

export const channelHead = style([channelRow, { borderBottom: `2.5px solid ${colors.black}` }]);

export const colLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
  textAlign: 'center',
});

export const cell = style({ display: 'grid', placeItems: 'center' });
