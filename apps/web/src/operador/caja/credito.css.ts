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

/** Anótalo a su cuenta (`OpFiado.dc.html`): pick who, or add them. */
export const wrap = style({ display: 'flex', flexDirection: 'column', gap: 12 });

export const lista = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  maxHeight: 320,
  overflowY: 'auto',
  padding: '2px 4px 4px 2px',
});

export const cliente = style({
  boxSizing: 'border-box',
  minHeight: 60,
  padding: '9px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  border: borders.quiet,
  borderRadius: radii[4],
  background: colors.white,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  color: colors.black,
  selectors: {
    '&[aria-checked="true"]': {
      border: borders.thick,
      background: colors.yellowSoft,
      boxShadow: shadows.small,
    },
  },
});

export const punto = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 22,
  height: 22,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  selectors: {
    [`${cliente}[aria-checked="true"] &::after`]: {
      content: '""',
      width: 10,
      height: 10,
      borderRadius: shapeRadii.pill,
      background: colors.black,
    },
  },
});

export const texto = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const nombre = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const debe = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.warningText,
  selectors: { '&[data-cero]': { color: colors.textMuted } },
});

export const quedaria = style([
  debe,
  { marginTop: 3, fontSize: portalFontSizes.md, fontWeight: typography.weights.extraBold },
]);

export const vacio = style({
  padding: '12px 4px',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const nuevo = style({
  border: borders.quiet,
  borderRadius: radii[4],
  background: colors.white,
  selectors: { '&[data-abierto]': { border: borders.thick, background: colors.yellowSoft } },
});

export const nuevoBoton = style({
  width: '100%',
  height: 56,
  padding: '0 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  border: 0,
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textAlign: 'left',
});

export const mas = style({
  flex: 'none',
  width: 30,
  height: 30,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[1],
  background: colors.yellow,
});

export const nuevoCampos = style({
  padding: '0 14px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

export const campo = style({ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 });

export const nota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const cambiar = style([
  pressable,
  {
    alignSelf: 'center',
    minHeight: 44,
    border: 0,
    background: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
    textDecoration: 'underline',
  },
]);
