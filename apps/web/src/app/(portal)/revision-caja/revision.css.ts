import { style } from '@vanilla-extract/css';
import {
  colors,
  denseRadii,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '@/styles/press.css';

/** Dueño · Revisión de caja (`Revision de caja.dc.html`): the inbox rows and the review form. */
export const pageTitle = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const pageSubtitle = style({
  margin: '6px 0 0',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const lista = style({
  overflow: 'hidden',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.white,
  boxShadow: shadows.hero,
});

export const fila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '16px 18px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { background: colors.yellowSoft },
  },
});

export const tile = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  color: colors.black,
});

export const nombre = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
  textWrap: 'pretty',
});

export const parece = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 9px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.warningSoft,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
  color: colors.warningText,
});

export const detalle = style({
  marginTop: 3,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const cifra = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const cifraLabel = style({
  marginTop: 2,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const rechazar = style([
  pressable,
  {
    boxSizing: 'content-box',
    flex: 'none',
    width: 46,
    height: 46,
    display: 'grid',
    placeItems: 'center',
    padding: 0,
    border: `2px solid ${colors.black}`,
    borderRadius: denseRadii.r13,
    background: colors.white,
    boxShadow: shadows.small,
    cursor: 'pointer',
    color: colors.black,
  },
]);

export const nota = style({
  display: 'flex',
  gap: 12,
  padding: '16px 18px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.yellowSoft,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

/** The file's link: blue, bold, underlined 2 px below. */
export const enlace = style({
  color: colors.blueText,
  fontWeight: typography.weights.bold,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
  selectors: { '&:hover': { color: colors.black } },
});
