import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/** Don Cuentas's page header (ADR-107): him on the left, his read of the day on the right. */
export const hero = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  gap: 28,
  alignItems: 'center',
  padding: '24px 32px',
  background: colors.yellow,
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.card,
  '@media': {
    'screen and (max-width: 767px)': { gridTemplateColumns: 'minmax(0, 1fr)', padding: 18 },
  },
});

export const quien = style({ display: 'grid', justifyItems: 'center', gap: 8 });

export const placa = style({
  display: 'grid',
  justifyItems: 'center',
  padding: '6px 14px',
  background: colors.black,
  color: colors.yellow,
  borderRadius: shapeRadii.pill,
});

export const nombre = style({
  margin: 0,
  color: colors.yellow,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
});

export const cargo = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
});

export const dice = style({ display: 'grid', gap: 10, minWidth: 0 });

export const cuando = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
});

export const lead = style({
  margin: 0,
  fontSize: portalFontSizes.display,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  textWrap: 'balance',
  '@media': { 'screen and (max-width: 767px)': { fontSize: portalFontSizes.xl5 } },
});

export const sub = style({
  margin: 0,
  maxWidth: 620,
  fontSize: portalFontSizes.lg,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
});

export const origen = style({
  justifySelf: 'start',
  padding: '4px 12px',
  background: colors.white,
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
});
