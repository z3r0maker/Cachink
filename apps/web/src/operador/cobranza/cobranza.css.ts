import { style } from '@vanilla-extract/css';
import {
  colors,
  denseRadii,
  fontSizes,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** Operador · Cobranza (`Operador Cobranza.dc.html`): client cards and today's abonos. */
export const cards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
  gap: 14,
});

export const card = style({
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.white,
  boxShadow: shadows.card,
});

export const avatar = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 46,
  height: 46,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nombre = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const estado = style({
  marginLeft: 'auto',
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
});

export const saldo = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.xl5,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const texto = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const cta = style([
  pressable,
  {
    flex: 1,
    height: 50,
    border: `2.5px solid ${colors.black}`,
    borderRadius: denseRadii.r13,
    background: colors.yellow,
    boxShadow: shadows.card,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.black,
    selectors: {
      '&:hover:not([aria-disabled])': { background: colors.yellowDeep },
      '&[aria-disabled]': { background: colors.gray100, cursor: 'default' },
    },
  },
]);

export const historial = style([
  pressable,
  {
    boxSizing: 'content-box',
    flex: 'none',
    width: 50,
    height: 50,
    display: 'grid',
    placeItems: 'center',
    border: `2px solid ${colors.black}`,
    borderRadius: denseRadii.r13,
    background: colors.white,
    boxShadow: shadows.small,
    color: colors.black,
    textDecoration: 'none',
  },
]);

export const abonosHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 18px',
  background: colors.gray100,
  borderBottom: `2.5px solid ${colors.black}`,
});

export const abonoRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '13px 18px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const abonoMonto = style({
  flex: 'none',
  minWidth: 98,
  textAlign: 'right',
  fontSize: fontSizes.xl,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.greenText,
});
