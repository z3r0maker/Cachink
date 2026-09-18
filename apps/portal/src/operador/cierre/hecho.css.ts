import { style } from '@vanilla-extract/css';
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
import { boton } from './cierre.css';

/** The band that blocks the close, and the «Turno cerrado» card. */
/* The blocking band. */
export const banda = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  padding: '16px 20px',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.warningSoft,
  boxShadow: shadows.card,
});

export const bandaTitulo = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const bandaBoton = style([
  pressable,
  {
    ...boton,
    flex: 'none',
    height: 46,
    padding: '0 18px',
    border: `2.5px solid ${colors.black}`,
    borderRadius: denseRadii.r13,
    background: colors.white,
    boxShadow: shadows.card,
  },
]);

/* Closed. */
export const hecho = style({
  padding: 26,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.greenSoft,
  boxShadow: shadows.hero,
});

export const hechoTile = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 46,
  height: 46,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: denseRadii.r13,
  background: colors.white,
  color: colors.greenText,
});

export const hechoTitulo = style({
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const dato = style({
  padding: '14px 16px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.white,
});

export const datoValor = style({
  marginTop: 4,
  fontSize: fontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
});

export const otroTurno = style([
  pressable,
  {
    ...boton,
    boxSizing: 'content-box',
    display: 'inline-flex',
    alignItems: 'center',
    height: 52,
    padding: '0 20px',
    border: `2.5px solid ${colors.black}`,
    borderRadius: denseRadii.r13,
    background: colors.yellow,
    boxShadow: shadows.card,
  },
]);

export const verConteo = style([
  pressable,
  {
    ...boton,
    height: 52,
    padding: '0 20px',
    border: `2px solid ${colors.black}`,
    borderRadius: denseRadii.r13,
    background: colors.white,
    boxShadow: shadows.small,
  },
]);
