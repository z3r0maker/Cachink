import { style, styleVariants } from '@vanilla-extract/css';
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

/** Operador · Cierre de turno (OpCierre, OpCierreBloqueado): layout and the right column. */
const TABULAR = 'tabular-nums';

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.04fr) minmax(0, 1fr)',
  gap: 20,
  alignItems: 'stretch',
  '@media': { 'screen and (max-width: 1179px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const columna = style({ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 });

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.ink,
});

export const mono = style({ fontVariantNumeric: TABULAR });

/* «Efectivo esperado»: the yellow card and its four parts. */
export const esperado = style({
  padding: '16px 22px 12px',
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.yellow,
  boxShadow: shadows.hero,
});

export const esperadoHead = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  flexWrap: 'wrap',
});

export const esperadoCifra = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.display,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.035em',
  fontVariantNumeric: TABULAR,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl5 } },
});

export const puedeCambiar = style({
  padding: '2px 9px',
  border: `2px solid ${colors.warningText}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.warningText,
});

export const parte = style({
  display: 'flex',
  alignItems: 'center',
  minHeight: 30,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  selectors: { '&:not(:last-child)': { borderBottom: `2px solid ${colors.yellowRule}` } },
});

export const parteValor = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  selectors: { '&[data-gasto]': { color: colors.redText } },
});

/* «Diferencia»: green, red or blue, with the reason chips inside. */
const difBase = {
  padding: '16px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  borderRadius: radii[7],
} as const;

export const dif = styleVariants({
  cuadra: {
    ...difBase,
    background: colors.greenSoft,
    border: `2.5px solid ${colors.greenText}`,
    boxShadow: `5px 5px 0 ${colors.greenText}`,
  },
  falta: {
    ...difBase,
    background: colors.redSoft,
    border: `2.5px solid ${colors.redText}`,
    boxShadow: `5px 5px 0 ${colors.redText}`,
  },
  sobra: {
    ...difBase,
    background: colors.blueSoft,
    border: `2.5px solid ${colors.blueText}`,
    boxShadow: `5px 5px 0 ${colors.blueText}`,
  },
});

/** Before the first bill is counted: no verdict yet, just the next step. */
export const difVacio = style({
  ...difBase,
  background: colors.white,
  border: borders.quiet,
});

export const difCifra = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.xl6,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl4 } },
});

export const texto = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const motivo = style([
  pressable,
  {
    boxSizing: 'border-box',
    height: 44,
    padding: '0 16px',
    border: borders.thin,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    selectors: { '&[aria-pressed="true"]': { background: colors.black, color: colors.yellow } },
  },
]);

export const nota = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 44,
  padding: '0 14px',
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
});

export const notaLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
  whiteSpace: 'nowrap',
});

export const notaInput = style({
  flex: 1,
  minWidth: 0,
  height: 40,
  border: 0,
  outline: 0,
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});
