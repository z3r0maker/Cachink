import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** «Lo que contó, por denominación»: bills as tiles, coins as round tokens. */
export const cabeza = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 10,
});

export const total = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const grupo = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  '@media': { '(max-width: 480px)': { flexDirection: 'column', alignItems: 'stretch', gap: 4 } },
});

export const grupoNombre = style({
  width: 66,
  flex: 'none',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const piezas = style({
  flex: 1,
  minWidth: 0,
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(42px, 1fr))',
  gap: 6,
  '@media': {
    '(max-width: 480px)': { gridTemplateColumns: 'repeat(auto-fit, minmax(34px, 1fr))' },
  },
});

export const pieza = style({
  height: 44,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  border: borders.thin,
  borderRadius: radii[1],
  background: colors.white,
  fontVariantNumeric: 'tabular-nums',
  selectors: {
    '&[data-tipo="moneda"]': { borderRadius: shapeRadii.pill, background: colors.yellowSoft },
    '&[data-cero]': { border: `2px solid ${colors.gray100}`, background: colors.gray100 },
  },
});

export const den = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const veces = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const subtotales = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});
