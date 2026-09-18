import { style } from '@vanilla-extract/css';
import { colors, denseRadii, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** Operador · Inventario (`Operador Inventario.dc.html`). */
export const tile = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 42,
  height: 42,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  color: colors.black,
});

/** «Entrada de mercancía» / «Merma»: native buttons, so 48 px include the border. */
export const accion = style([
  pressable,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    height: 48,
    padding: '0 18px',
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[3],
    boxShadow: shadows.card,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.black,
  },
]);

export const qty = style({
  flex: 'none',
  minWidth: 86,
  textAlign: 'right',
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const delta = style({
  flex: 'none',
  minWidth: 70,
  textAlign: 'right',
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const nada = style({
  padding: '34px 18px',
  textAlign: 'center',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

/* Form: product picker and quantity. */

export const picker = style({
  boxSizing: 'content-box',
  height: 48,
  padding: '0 13px',
  marginBottom: 9,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
});

export const pickerInput = style({
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const opciones = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  maxHeight: 210,
  overflowY: 'auto',
});

export const opcion = style({
  boxSizing: 'content-box',
  minHeight: 52,
  padding: '0 13px',
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  border: `2px solid ${colors.gray200}`,
  borderRadius: denseRadii.r13,
  background: colors.white,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  selectors: {
    '&[aria-pressed="true"]': {
      border: `2.5px solid ${colors.black}`,
      background: colors.yellowSoft,
    },
  },
});

export const opcionName = style({
  flex: 1,
  minWidth: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textWrap: 'pretty',
});

export const opcionQty = style({
  flex: 'none',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const sinOpciones = style({
  padding: 14,
  border: `2px solid ${colors.gray200}`,
  borderRadius: denseRadii.r13,
  background: colors.gray100,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const cantidad = style({
  width: '100%',
  height: 56,
  padding: '0 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.ink,
  selectors: { '&:focus': { borderWidth: 2.5 } },
});

/**
 * State chip, count and quick actions. On a phone (under 760 px) they take the
 * second line, under the name and threshold (`groupBasis` in the file).
 */
export const grupo = style({
  flex: '0 1 auto',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
  '@media': { '(max-width: 759px)': { flexBasis: '100%' } },
});
