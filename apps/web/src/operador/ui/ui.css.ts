import { style, styleVariants } from '@vanilla-extract/css';
import {
  colors,
  denseRadii,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { liftOnHover } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/**
 * Pieces every operator screen repeats, measured from the design files:
 * the content column, the KPI card, the list card with its tinted head, and
 * the shortcut card. Fixed boxes are content-box, as in the files (O-10).
 */
const contentBox = { boxSizing: 'content-box' } as const;

/** `<main>`: 32 px sides (16 on the phone), room for the tab bar at the foot. */
export const main = styleVariants({
  top22: { flex: 1, padding: '22px 32px 40px' },
  top24: { flex: 1, padding: '24px 32px 44px' },
});
export const mainPhone = style({
  '@media': { [PHONE]: { paddingLeft: 16, paddingRight: 16, paddingBottom: 96 } },
});

export const stack = style({
  maxWidth: 1760,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
});

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
});

/* KPI ----------------------------------------------------------------- */

export const kpiGrid = style({ display: 'grid', gap: 14 });

export const kpi = style({
  padding: '16px 18px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[4],
  boxShadow: shadows.card,
});

export const kpiValue = style({
  marginTop: 6,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tighter,
});

export const kpiHint = style({
  marginTop: 3,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

/* List card ------------------------------------------------------------ */

export const listCard = style({
  minWidth: 0,
  overflow: 'hidden',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.white,
  boxShadow: shadows.hero,
});

export const listHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  padding: '14px 18px',
  borderBottom: `2.5px solid ${colors.black}`,
});

export const countPill = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 9px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const headNote = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

/** The head's right-hand text link («Ver todos», «Cerrar turno»). */
export const headLink = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.blueText,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
  selectors: { '&:hover': { color: colors.black } },
});

/** A row inside a list card; hover tints it, the last one drops its rule. */
export const row = style({
  display: 'flex',
  alignItems: 'center',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&[data-hover]:hover': { background: colors.yellowSoft },
  },
});

export const tintBox = style({
  ...contentBox,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: denseRadii.r11,
  color: colors.black,
});

/* Shortcut card --------------------------------------------------------- */

export const shortcut = style([
  liftOnHover,
  {
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[4],
    boxShadow: shadows.card,
    color: colors.black,
    textDecoration: 'none',
  },
]);

export const shortcutLabel = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
});

export const shortcutHint = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

/** Caja keeps room at the foot for its «Cobrar» bar: 108 px narrow, 172 on the phone. */
export const mainCaja = style({
  '@media': {
    'screen and (max-width: 1239px)': { paddingBottom: 108 },
    [PHONE]: { paddingBottom: 172 },
  },
});

/**
 * A list row that wraps below 1000 px (the files' `rowBasis`): the name block
 * takes the whole first line, the chips, amount and actions the second.
 */
export const rowWrap = style({ flexWrap: 'wrap' });

export const rowMain = style({
  flex: '1 1 0',
  minWidth: 0,
  '@media': { '(max-width: 999px)': { flexBasis: '100%' } },
});
