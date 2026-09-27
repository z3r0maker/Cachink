import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  denseRadii,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** «Cuenta el efectivo de la caja» (OpCierre): bills and coins side by side, «Contaste» below. */
const TABULAR = 'tabular-nums';

export const card = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.white,
  boxShadow: shadows.hero,
});

export const head = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 20px',
  borderBottom: borders.quiet,
  background: colors.offwhite,
});

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.ink,
});

export const limpiar = style([
  pressable,
  {
    marginLeft: 'auto',
    height: 44,
    padding: '0 14px',
    border: borders.quiet,
    borderRadius: radii[1],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
    whiteSpace: 'nowrap',
    selectors: { '&:hover': { color: colors.black } },
  },
]);

export const columnas = style({
  padding: '8px 18px 10px',
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 22,
  '@media': { [PHONE]: { gridTemplateColumns: 'minmax(0, 1fr)', gap: 10, padding: '6px 14px' } },
});

export const columna = style({ display: 'flex', flexDirection: 'column', minWidth: 0 });

export const colHead = style({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const subtotal = style({
  letterSpacing: 0,
  fontVariantNumeric: TABULAR,
  color: colors.black,
});

export const fila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 50,
  borderBottom: `2px solid ${colors.gray100}`,
});

/** The denomination: a bill is a rounded rectangle, a coin a pill. */
export const denom = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 70,
  height: 36,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: borders.thin,
  borderRadius: radii[0],
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  color: colors.black,
  selectors: { '&[data-moneda]': { borderRadius: shapeRadii.pill } },
});

export const pasos = style({ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 });

export const paso = style([
  pressable,
  {
    boxSizing: 'border-box',
    width: 44,
    height: 44,
    display: 'grid',
    placeItems: 'center',
    padding: 0,
    border: borders.thin,
    borderRadius: denseRadii.r11,
    background: colors.white,
    color: colors.black,
    selectors: { '&[data-mas]': { background: colors.yellow } },
  },
]);

export const piezas = style({
  boxSizing: 'border-box',
  width: 52,
  height: 44,
  textAlign: 'center',
  border: borders.thin,
  borderRadius: denseRadii.r11,
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  color: colors.black,
  selectors: { '&:focus-visible': { outline: `2px solid ${colors.blueText}`, outlineOffset: 1 } },
});

export const pie = style({
  marginTop: 'auto',
  display: 'flex',
  alignItems: 'baseline',
  padding: '14px 20px 16px',
  borderTop: borders.thin,
  background: colors.yellowSoft,
});

export const contado = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  fontVariantNumeric: TABULAR,
  color: colors.black,
});
