import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** Operador · Inventario lists (`OpInventario.dc.html`): stock rows and the turno's movements. */
export const card = style({
  minWidth: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

const rule = { borderBottom: borders.quiet, borderBottomColor: colors.gray100 } as const;

/** Tile · name · bar · count · chip · Llegó · Se echó a perder; three lines on a phone. */
export const fila = style({
  ...rule,
  display: 'grid',
  gridTemplateColumns: '44px minmax(0, 1fr) minmax(90px, 170px) 96px 104px 92px 174px',
  gridTemplateAreas: '"tile name bar cant chip llego merma"',
  alignItems: 'center',
  gap: 14,
  minHeight: 58,
  padding: '6px 18px',
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&:hover, &[data-sel]': { background: colors.yellowSoft },
  },
  '@media': {
    [PHONE]: {
      gridTemplateColumns: '44px minmax(0, 1fr) auto',
      gridTemplateAreas: '"tile name cant" "bar bar chip" "acc acc acc"',
      gap: 10,
      padding: '12px 14px',
    },
  },
});

export const tile = style({
  gridArea: 'tile',
  width: 44,
  height: 44,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
  color: colors.black,
});

export const nombre = style({
  gridArea: 'name',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

export const name = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const detalle = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.textMuted,
});

export const barra = style({
  gridArea: 'bar',
  position: 'relative',
  height: 10,
  border: borders.quiet,
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
});

export const barraFill = style({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  borderRadius: shapeRadii.pill,
});

/** The threshold: always at half the bar. */
export const barraAviso = style({
  position: 'absolute',
  left: '50%',
  top: -5,
  bottom: -5,
  width: 2,
  borderRadius: shapeRadii.mark,
  background: colors.black,
});

export const cant = style({
  gridArea: 'cant',
  textAlign: 'right',
  whiteSpace: 'nowrap',
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const chip = style({ gridArea: 'chip', justifySelf: 'start' });

/** The two actions: grid cells on a wide screen, their own line on a phone. */
export const acciones = style({
  display: 'contents',
  '@media': { [PHONE]: { gridArea: 'acc', display: 'flex', gap: 10 } },
});

const accion = {
  height: 44,
  padding: '0 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
  '@media': { [PHONE]: { flex: 1 } },
} as const;

export const llego = style([
  pressable,
  { ...accion, gridArea: 'llego', border: borders.thin, color: colors.black },
]);

export const llegoIcon = style({ color: colors.greenText, display: 'grid' });

export const merma = style([
  pressable,
  {
    ...accion,
    gridArea: 'merma',
    border: borders.thin,
    borderColor: colors.redText,
    color: colors.redText,
  },
]);

/** Movements: hour · tile · product · what happened · how much. */
export const mov = style({
  ...rule,
  display: 'grid',
  gridTemplateColumns: '70px 44px minmax(0, 1fr) 170px 130px',
  gridTemplateAreas: '"hora tile name chip cant"',
  alignItems: 'center',
  gap: 14,
  minHeight: 62,
  padding: '6px 20px',
  selectors: { '&:last-child': { borderBottom: 'none' } },
  '@media': {
    [PHONE]: {
      gridTemplateColumns: '44px minmax(0, 1fr) auto',
      gridTemplateAreas: '"tile name cant" "tile hora chip"',
      gap: '4px 12px',
      padding: '10px 14px',
    },
  },
});

export const movHead = style([
  mov,
  {
    minHeight: 0,
    padding: '12px 20px',
    borderBottom: borders.quiet,
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.extraBold,
    letterSpacing: '0.1em',
    color: colors.textMuted,
    '@media': { [PHONE]: { display: 'none' } },
  },
]);

export const hora = style({
  gridArea: 'hora',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const movDetalle = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const movCant = style([cant, { fontSize: portalFontSizes.lg }]);

export const nada = style({
  padding: '34px 18px',
  textAlign: 'center',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});
