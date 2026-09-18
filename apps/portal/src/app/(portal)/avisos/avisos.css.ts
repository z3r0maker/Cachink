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

export const noticeRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  padding: '16px 0',
  borderBottom: `2px solid ${colors.gray200}`,
});

/** The severity tile. Colour never carries the meaning alone — an icon does. */
export const severityTile = style({
  width: 40,
  height: 40,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  fontWeight: typography.weights.extraBold,
});

export const noticeTitle = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const noticeBody = style({
  marginTop: 4,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  textWrap: 'pretty',
});

export const noticeWhen = style({
  marginTop: 6,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
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
