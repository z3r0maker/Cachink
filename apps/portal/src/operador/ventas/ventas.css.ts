import { style } from '@vanilla-extract/css';
import {
  colors,
  denseRadii,
  portalFontSizes,
  radii,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** Operador · Ventas rows (`Operador Ventas.dc.html`). */
export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '14px 18px',
  borderBottom: `2px solid ${colors.gray100}`,
  transition: 'background 90ms linear',
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&[data-cancelada]': { background: colors.gray100 },
    '&:hover': { background: colors.yellowSoft },
  },
});

export const folio = style({
  flex: 'none',
  minWidth: 62,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const method = style({
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '3px 11px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
  color: colors.black,
});

export const time = style({
  flex: 'none',
  minWidth: 58,
  textAlign: 'right',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const amount = style({
  flex: 'none',
  minWidth: 100,
  textAlign: 'right',
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
});

/** The row's two 40 px square actions: to the ticket, and cancel. */
export const square = style([
  pressable,
  {
    boxSizing: 'content-box',
    flex: 'none',
    width: 40,
    height: 40,
    display: 'grid',
    placeItems: 'center',
    padding: 0,
    border: `2px solid ${colors.black}`,
    borderRadius: denseRadii.r11,
    background: colors.white,
    boxShadow: `2px 2px 0 ${colors.black}`,
    color: colors.black,
    textDecoration: 'none',
  },
]);

export const cancelada = style({
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.redSoft,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
  color: colors.redText,
});

/* Cancel modal. */

export const resumen = style({
  padding: '14px 16px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.gray100,
});

export const resumenAmount = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});
