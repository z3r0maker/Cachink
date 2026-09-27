import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** Operador · Gastos (OpGastos): the title's action, the figures strip and the table. */
export const cabeza = style({ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' });

export const registrar = style([
  pressable,
  {
    marginLeft: 'auto',
    height: 48,
    padding: '0 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: borders.thin,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.body,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    '@media': { [PHONE]: { marginLeft: 0, width: '100%', justifyContent: 'center' } },
  },
]);

export const cifras = style({
  display: 'flex',
  alignItems: 'center',
  padding: '14px 8px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
  '@media': { [PHONE]: { flexWrap: 'wrap', rowGap: 12 } },
});

export const cifra = style({
  flex: '1 1 0',
  minWidth: 0,
  padding: '0 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  selectors: { '&:not(:last-child)': { borderRight: borders.quiet } },
  '@media': {
    [PHONE]: {
      padding: '0 12px',
      flexBasis: '40%',
      selectors: { '&:nth-child(2)': { borderRight: 0 } },
    },
  },
});

export const cifraLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const cifraValor = style({
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const cifraNota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.warningText,
});

/* The table. */
const COLUMNAS = '44px minmax(0, 1fr) 150px 170px 60px 110px';

export const tabla = style({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const encabezado = style({
  display: 'grid',
  gridTemplateColumns: COLUMNAS,
  gap: 14,
  padding: '11px 20px',
  borderBottom: borders.quiet,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: colors.textMuted,
  '@media': { 'screen and (max-width: 1023px)': { display: 'none' } },
});

export const fila = style({
  display: 'grid',
  gridTemplateColumns: COLUMNAS,
  gap: 14,
  alignItems: 'center',
  minHeight: 66,
  padding: '0 20px',
  selectors: { '&:not(:last-child)': { borderBottom: `2px solid ${colors.gray100}` } },
  '@media': {
    'screen and (max-width: 1023px)': {
      gridTemplateColumns: '44px minmax(0, 1fr) auto',
      gridTemplateAreas: '"i q m" "i c c"',
      rowGap: 6,
      padding: '12px 16px',
    },
  },
});

export const tile = style({
  boxSizing: 'border-box',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
  color: colors.black,
  '@media': { 'screen and (max-width: 1023px)': { gridArea: 'i' } },
});

export const que = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  '@media': { 'screen and (max-width: 1023px)': { gridArea: 'q' } },
});

export const concepto = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const detalle = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

/** Category and receipt chips on the rows. */
export const chip = style({
  justifySelf: 'start',
  padding: '3px 10px',
  borderWidth: 2,
  borderStyle: 'solid',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const chips = style({
  display: 'contents',
  '@media': {
    'screen and (max-width: 1023px)': {
      gridArea: 'c',
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      alignItems: 'center',
    },
  },
});

export const hora = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const monto = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.redText,
  textAlign: 'right',
  '@media': { 'screen and (max-width: 1023px)': { gridArea: 'm' } },
});
