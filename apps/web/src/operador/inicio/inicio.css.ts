import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** Operador · Inicio, from `Xangarro Portal - Operador Inicio.dc.html`. */
const contentBox = { boxSizing: 'content-box' } as const;
const NARROW = 'screen and (max-width: 1179px)';

export const h1 = style({
  margin: 0,
  fontSize: portalFontSizes.xl6,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl4 } },
});

export const fecha = style({
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/* «Lo primero» --------------------------------------------------------- */

export const hero = style({
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  flexWrap: 'wrap',
  padding: 24,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[6],
  boxShadow: shadows.hero,
  '@media': { [PHONE]: { padding: 18 } },
});

export const heroIcon = style({
  ...contentBox,
  flex: 'none',
  width: 58,
  height: 58,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.white,
  color: colors.black,
});

export const heroText = style({ flex: 1, minWidth: 220 });

export const heroTitle = style({
  marginTop: 6,
  fontSize: portalFontSizes.xl5,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  textWrap: 'pretty',
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl3 } },
});

export const heroBody = style({
  marginTop: 7,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const heroCta = style([
  pressable,
  {
    ...contentBox,
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 62,
    padding: '0 26px',
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[4],
    boxShadow: shadows.card,
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    color: colors.black,
    textDecoration: 'none',
    selectors: { '&:hover': { background: colors.yellowDeep } },
  },
]);

/* The two-column block ---------------------------------------------------- */

export const columns = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
  gap: 18,
  alignItems: 'start',
  '@media': { [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const side = style({ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 });

/* Row text shared by the three lists. */
export const rowTitle = style({
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textWrap: 'pretty',
});

export const rowDetail = style({
  marginTop: 2,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const rowCta = style([
  pressable,
  {
    ...contentBox,
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    height: 42,
    padding: '0 15px',
    border: `2px solid ${colors.black}`,
    borderRadius: radii[2],
    background: colors.white,
    boxShadow: shadows.small,
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: colors.black,
    textDecoration: 'none',
  },
]);

export const dot = style({
  ...contentBox,
  flex: 'none',
  width: 9,
  height: 9,
  marginTop: 6,
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
});

export const chip = style({
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 11px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

/** «Hoy no»: the row's second action, gray, removes the task for today. */
export const hoyNo = style([
  rowCta,
  { padding: '0 14px', background: colors.gray100, cursor: 'pointer', fontFamily: 'inherit' },
]);
