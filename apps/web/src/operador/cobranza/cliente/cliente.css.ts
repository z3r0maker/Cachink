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

import { pressable } from '../../../styles/press.css';
import { back } from '../../shell/back.css';
import { PHONE } from '../../shell/shell.css';

/** Operador · Detalle de cliente (`Operador Detalle de cliente.dc.html`). */
export const hero = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  padding: 24,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[6],
  boxShadow: shadows.hero,
  '@media': { [PHONE]: { padding: 18 } },
});

export const avatar = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 62,
  height: 62,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nombre = style({
  fontSize: portalFontSizes.xl5,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  textWrap: 'pretty',
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl3 } },
});

export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
  selectors: { '&[data-parcial]': { padding: '3px 10px', flex: 'none' } },
});

export const sub = style({
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const saldo = style({
  marginTop: 6,
  fontSize: portalFontSizes.balance,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tightest,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl6 } },
});

export const cta = style([
  pressable,
  {
    flex: 'none',
    height: 62,
    padding: '0 24px',
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[4],
    background: colors.yellow,
    boxShadow: shadows.card,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    color: colors.black,
    selectors: {
      '&:hover:not(:disabled)': { background: colors.yellowDeep },
      '&:disabled': { background: colors.gray100 },
    },
  },
]);

export const fila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 13,
  padding: '14px 18px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&[data-hover]:hover': { background: colors.yellowSoft },
    '&[data-mov]': { padding: '13px 18px' },
  },
});

export const cifra = style({
  flex: 'none',
  minWidth: 96,
  textAlign: 'right',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  selectors: { '&[data-grande]': { fontSize: fontSizes.xl } },
});

export const movTile = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 38,
  height: 38,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: denseRadii.r11,
  color: colors.black,
});

export const movTitulo = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.01em',
  color: colors.black,
  textWrap: 'pretty',
});

/** Header action: a native button, so 44 px include the border. */
export const recordar = style([
  back,
  { boxSizing: 'border-box', padding: '0 16px', cursor: 'pointer', fontFamily: 'inherit' },
]);

export const mensaje = style({
  padding: '14px 16px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.gray100,
});

export const mensajeTexto = style({
  marginTop: 6,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

export const enviar = style([
  pressable,
  {
    height: 56,
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.card,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.black,
    selectors: { '&:disabled': { background: colors.gray100 } },
  },
]);

export const nada = style({
  padding: '36px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 9,
  textAlign: 'center',
});

export const nadaTile = style({
  boxSizing: 'content-box',
  width: 52,
  height: 52,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.greenSoft,
  color: colors.greenText,
});

/** The due line under an open ticket: gray, red once past due. */
export const vence = style({
  marginTop: 2,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
});
