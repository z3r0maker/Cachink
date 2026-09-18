import { style } from '@vanilla-extract/css';
import {
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** «Abono de …»: the current balance, quick amounts and the green «se aplica a» block. */
export const actual = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  padding: '14px 16px',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.gray100,
});

export const actualValue = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const rapido = style([
  pressable,
  {
    boxSizing: 'content-box',
    display: 'inline-flex',
    alignItems: 'center',
    height: 42,
    padding: '0 15px',
    border: `2px solid ${colors.black}`,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    boxShadow: shadows.small,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    fontVariantNumeric: 'tabular-nums',
    color: colors.black,
  },
]);

export const aplica = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
  padding: '14px 16px',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.greenSoft,
});

export const aplicaText = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textAlign: 'right',
  textWrap: 'pretty',
});

export const restanteLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.black,
});

export const restante = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.xl6,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

/** Detalle de cliente's remaining balance: 32 px. */
export const restanteChico = style([restante, { fontSize: fontSizes.xl5 }]);
