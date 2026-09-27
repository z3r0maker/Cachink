import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  denseRadii,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

const NUM = 'tabular-nums';
const INLINE = 'inline-flex';

/**
 * El Mostrador's quiet pieces for the reading screens (Inicio, Mi turno,
 * Pendientes, Avisos): a page title on one baseline with its subtitle, the
 * gray-edged panel with an eyebrow head, the quiet figure card and the row
 * glyph square. Black edges stay for what you can press (ADR-107).
 */
export const pageHead = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  flexWrap: 'wrap',
});

export const pageTitle = style({
  margin: 0,
  fontSize: portalFontSizes.xl6,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.035em',
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl4 } },
});

export const pageSub = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const panel = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const panelHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  minHeight: 44,
  padding: '4px 18px',
  borderBottom: borders.quiet,
});

export const count = style({
  boxSizing: 'border-box',
  minWidth: 24,
  height: 24,
  padding: '0 7px',
  display: INLINE,
  alignItems: 'center',
  justifyContent: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: NUM,
  color: colors.black,
});

export const panelNote = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** The head's right-hand link («Ver todos», «Cerrar turno»). */
export const headLink = style({
  marginLeft: 'auto',
  minHeight: 44,
  display: INLINE,
  alignItems: 'center',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  selectors: { '&:hover': { color: colors.gray600 } },
});

/** A quiet button (white, gray edge): «Hoy no», «Ver todas», «Marcar leído». */
export const quietBtn = style([
  pressable,
  {
    flex: 'none',
    height: 44,
    padding: '0 14px',
    display: INLINE,
    alignItems: 'center',
    gap: 8,
    border: borders.quiet,
    borderRadius: denseRadii.r13,
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
    whiteSpace: 'nowrap',
    selectors: { '&:hover': { color: colors.black } },
  },
]);

/** A secondary action: white, black edge, a small hard shadow. */
export const outlineBtn = style([
  pressable,
  {
    flex: 'none',
    height: 44,
    padding: '0 16px',
    display: INLINE,
    alignItems: 'center',
    gap: 8,
    border: borders.thin,
    borderRadius: denseRadii.r13,
    background: colors.white,
    boxShadow: `2px 2px 0 ${colors.black}`,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
]);

export const outlineYellow = style({ background: colors.yellow });

/** The primary action: yellow, black edge, hard shadow. */
export const primaryBtn = style([
  pressable,
  {
    flex: 'none',
    height: 56,
    padding: '0 22px',
    display: INLINE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: borders.thick,
    borderRadius: radii[4],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.lg,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
]);

/** The tinted square that carries a row's glyph: black edge, 44 px. */
export const tile = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: denseRadii.r13,
  color: colors.black,
});

export const rowTitle = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textWrap: 'pretty',
});

export const rowDetail = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

/** A status chip: pill, colored 2 px edge set inline with its text color. */
export const chip = style({
  flex: 'none',
  boxSizing: 'border-box',
  height: 24,
  padding: '0 10px',
  display: INLINE,
  alignItems: 'center',
  gap: 6,
  borderWidth: 2,
  borderStyle: 'solid',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: NUM,
  whiteSpace: 'nowrap',
});

export const mono = style({ fontVariantNumeric: NUM });
