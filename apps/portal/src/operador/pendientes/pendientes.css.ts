import { keyframes, style } from '@vanilla-extract/css';
import {
  colors,
  denseRadii,
  fontSizes,
  portalFontSizes,
  radii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** Registros por enviar (`Operador Pendientes.dc.html`). */
export const titulo = style({
  margin: 0,
  fontSize: fontSizes.xl5,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl4 } },
});

/** A `<p>`: the design system's `.t-body, p` rule sets line-height 1.45. */
export const intro = style({
  margin: '8px 0 0',
  lineHeight: 1.45,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const heroe = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  padding: '18px 20px',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  boxShadow: shadows.hero,
});

export const heroeTile = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 52,
  height: 52,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.white,
  color: colors.black,
});

const girar = keyframes({ to: { transform: 'rotate(360deg)' } });

export const girando = style({
  display: 'grid',
  animation: `${girar} 1s linear infinite`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const heroeTitulo = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const heroeCuerpo = style({
  marginTop: 3,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const reintentar = style([
  pressable,
  {
    flex: 'none',
    height: 50,
    padding: '0 20px',
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[3],
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
      '&:hover': { background: colors.yellowDeep },
      '&[data-enviando]': { background: colors.white, cursor: 'progress' },
    },
  },
]);

export const fila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 18px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const monto = style({
  flex: 'none',
  minWidth: 96,
  textAlign: 'right',
  fontSize: fontSizes.xl,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const vacia = style({
  padding: '44px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  textAlign: 'center',
});

export const vaciaTile = style({
  boxSizing: 'content-box',
  width: 58,
  height: 58,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.greenSoft,
  color: colors.greenText,
});

export const vaciaTitulo = style({
  fontSize: fontSizes.xl,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const alCierre = style([
  pressable,
  {
    boxSizing: 'content-box',
    marginTop: 6,
    display: 'inline-flex',
    alignItems: 'center',
    height: 48,
    padding: '0 20px',
    border: `2.5px solid ${colors.black}`,
    borderRadius: denseRadii.r13,
    background: colors.yellow,
    boxShadow: shadows.card,
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.black,
    textDecoration: 'none',
  },
]);
