import { style } from '@vanilla-extract/css';
import { colors, denseRadii, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** Operador · Cierre de turno (`Operador Cierre de turno.dc.html`). */
const TABULAR = 'tabular-nums';

export const boton = {
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.black,
  textDecoration: 'none',
} as const;

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 420px',
  gap: 16,
  alignItems: 'start',
  '@media': { 'screen and (max-width: 1179px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const columna = style({ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 });

export const texto = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

/* The count. */
export const conteo = style({
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

export const denom = style({
  boxSizing: 'content-box',
  flex: 'none',
  minWidth: 74,
  height: 40,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: denseRadii.r11,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  color: colors.black,
});

export const tipo = style({
  flex: 'none',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const piezas = style({
  width: 62,
  height: 40,
  textAlign: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: denseRadii.r11,
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  color: colors.ink,
});

export const importe = style({
  flex: 'none',
  minWidth: 96,
  textAlign: 'right',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  color: colors.black,
  selectors: { '&[data-cero]': { color: colors.gray400 } },
});

export const contado = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  padding: '16px 18px',
  borderTop: `2.5px solid ${colors.black}`,
  background: colors.white,
});

export const rotulo = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.black,
});

export const cifra = style({
  marginLeft: 'auto',
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

/* Right column cards. */
export const tarjeta = style({
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.white,
  boxShadow: shadows.hero,
});

export const esperado = style({
  lineHeight: 1,
  fontSize: portalFontSizes.displayLg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  letterSpacing: typography.letterSpacing.tightest,
  color: colors.black,
});

export const difLabel = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.01em',
  color: colors.black,
});

export const resumenFila = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  paddingBottom: 8,
  borderBottom: `2px solid ${colors.gray100}`,
});

export const resumenLabel = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

/** Free to wrap on the phone, as in the file (no `flex: none`). */
export const resumenValor = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
});

export const cerrar = style([
  pressable,
  {
    ...boton,
    height: 58,
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontSize: portalFontSizes.md,
    letterSpacing: typography.letterSpacing.widest,
    selectors: {
      '&:hover:not(:disabled)': { background: colors.yellowDeep },
      '&:disabled': { background: colors.gray100 },
    },
  },
]);
