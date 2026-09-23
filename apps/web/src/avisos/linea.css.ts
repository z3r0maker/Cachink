import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** One aviso's row, shared by the Avisos page and the bell panel (P-31). */
export const noticeRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  // Horizontal padding since D-4 gave a read row its own ground: without it
  // the tint would run flush against the text.
  padding: '16px 14px',
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

/** A muted 13px aside — «Siempre activo» on the preferences matrix. */
export const noticeWhen = style({
  marginTop: 6,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

/**
 * Unread is encoded three ways, never by a word (D-4): a yellow dot, a white
 * ground against the read row's offwhite, and the title at 800 against 600.
 * The design writes the state into the row; «Sin leer» was ours.
 */
export const noticeRowLeido = style({ background: colors.offwhite });

export const unreadDot = style({
  width: 10,
  height: 10,
  flex: 'none',
  marginTop: 8,
  borderRadius: 9999,
  border: `2px solid ${colors.black}`,
  background: colors.yellow,
});

/** The same 10px box, so a read row keeps the unread row's alignment. */
export const unreadDotOff = style([unreadDot, { border: 'none', background: 'transparent' }]);

export const noticeTitleLeido = style({ fontWeight: typography.weights.semibold });

/** «Hace 40 min · Xangarro!» — 12px/700, the design's meta line. */
export const noticeMeta = style({
  marginTop: 6,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  color: colors.gray600,
});
