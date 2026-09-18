import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** One aviso's row, shared by the Avisos page and the bell panel (P-31). */
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
