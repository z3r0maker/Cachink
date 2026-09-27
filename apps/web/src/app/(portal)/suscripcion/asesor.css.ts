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

/** «Don Cuentas en cada plan»: one card per plan, yours on soft yellow. */
const carta = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  minWidth: 0,
  padding: '16px 20px',
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.hero,
} as const;

export const donCarta = style({ ...carta, background: colors.white });

export const donCartaTuya = style({ ...carta, background: colors.yellowSoft });

export const donHead = style({ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' });

export const donImg = style({ width: 44, height: 44, objectFit: 'contain', flex: 'none' });

export const donNombre = style({ display: 'flex', alignItems: 'center', gap: 8 });

export const donLinea = style({
  fontSize: portalFontSizes.body,
  lineHeight: 1.35,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const tuPlanChico = style({
  padding: '1px 8px',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});
