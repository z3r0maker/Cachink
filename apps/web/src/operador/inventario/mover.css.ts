import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** The movement panel (`OpInventario.dc.html`, the drawer). */
export const tipos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 4,
  padding: 4,
  borderRadius: radii[4],
  background: colors.gray100,
});

export const tipo = style([
  pressable,
  {
    minHeight: 58,
    padding: '6px 12px',
    border: borders.thin,
    borderColor: 'transparent',
    borderRadius: radii[2],
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    lineHeight: 1.25,
    fontWeight: typography.weights.extraBold,
    color: colors.gray600,
    textAlign: 'center',
    selectors: {
      '&[aria-checked="true"]': {
        borderColor: colors.black,
        background: colors.yellow,
        color: colors.black,
        boxShadow: shadows.small,
      },
    },
  },
]);

export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: 14,
  borderRadius: radii[4],
  background: colors.offwhite,
});

export const itemTile = style({
  flex: 'none',
  width: 52,
  height: 52,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[3],
  color: colors.black,
});

export const itemCol = style({ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 });

export const itemName = style({
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const itemSub = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const campo = style({ display: 'flex', flexDirection: 'column', gap: 8 });

export const label = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const opcional = style({ fontWeight: typography.weights.semibold, color: colors.textMuted });

export const stepper = style({ display: 'flex', alignItems: 'center', gap: 10 });

export const paso = style([
  pressable,
  {
    flex: 'none',
    width: 56,
    height: 56,
    display: 'grid',
    placeItems: 'center',
    border: borders.thin,
    borderRadius: radii[3],
    background: colors.white,
    color: colors.black,
  },
]);

export const pasoMas = style([paso, { background: colors.yellow }]);

export const cantidadBox = style({
  flex: 1,
  minWidth: 0,
  height: 56,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  border: borders.thick,
  borderRadius: radii[3],
  background: colors.white,
  selectors: { '&:focus-within': { outline: borders.thick, outlineColor: colors.yellow } },
});

export const cantidadInput = style({
  width: 84,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  textAlign: 'right',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.xl5,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  selectors: { '&:focus-visible': { outline: 'none', boxShadow: 'none' } },
});

export const unidad = style({
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
});

export const quedan = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const motivos = style({ display: 'flex', flexWrap: 'wrap', gap: 8 });

export const motivo = style([
  pressable,
  {
    height: 44,
    padding: '0 16px',
    border: borders.quiet,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    selectors: {
      '&[aria-checked="true"]': {
        border: borders.thin,
        background: colors.black,
        color: colors.yellow,
      },
    },
  },
]);

export const texto = style({
  height: 48,
  boxSizing: 'border-box',
  padding: '0 14px',
  border: borders.quiet,
  borderRadius: radii[3],
  outline: 'none',
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  selectors: { '&:focus': { borderColor: colors.black } },
});
