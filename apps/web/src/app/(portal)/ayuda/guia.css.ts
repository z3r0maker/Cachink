import { style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/** A Don Cuentas guide in its drawer (ADR-107): the steps, done / current / to go. */
export const empuja = style({ marginLeft: 'auto' });

export const pasos = style({
  display: 'grid',
  gap: 8,
  margin: '20px 0 0',
  padding: 0,
  listStyle: 'none',
});

const pasoBase = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  padding: '10px 12px',
  borderRadius: radii[3],
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
} as const;

export const paso = styleVariants({
  hecho: { ...pasoBase, color: colors.gray600 },
  actual: { ...pasoBase, background: colors.yellowSoft, border: borders.thin },
  falta: { ...pasoBase, color: colors.gray600 },
});

export const pasoNum = style({
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  width: 26,
  height: 26,
  borderRadius: shapeRadii.pill,
  background: colors.black,
  color: colors.yellow,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
});
