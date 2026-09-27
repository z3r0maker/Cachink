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
import { PHONE } from '../shell/shell.css';

/** «Mandar comprobante» (OpComprobante): the receipt beside the three ways to send it. */
export const cabeza = style({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '18px 20px 18px 24px',
  borderBottom: borders.quiet,
  '@media': { [PHONE]: { padding: '14px 14px 14px 16px', gap: 10 } },
});

export const check = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: borders.thick,
  borderRadius: shapeRadii.pill,
  background: colors.green,
  color: colors.black,
});

export const titulos = style({ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 });
export const verde = style({ color: colors.greenText, fontVariantNumeric: 'tabular-nums' });

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.cardTitle } },
});

export const cerrar = style({ marginLeft: 'auto' });

export const cuerpo = style({
  display: 'grid',
  gridTemplateColumns: '350px minmax(0, 1fr)',
  gap: 24,
  padding: '22px 24px',
  overflowY: 'auto',
  '@media': { [PHONE]: { gridTemplateColumns: 'minmax(0, 1fr)', padding: 16, gap: 18 } },
});

export const muestra = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 16,
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.offwhite,
  '@media': { [PHONE]: { order: 2 } },
});

export const lado = style({ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 });
export const grupo = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const tel = style({
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
});

export const campoTel = style({ minHeight: 52 });

export const ayuda = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  selectors: { '&[data-mal]': { color: colors.redText } },
});

export const opcion = style([
  pressable,
  {
    boxSizing: 'border-box',
    minHeight: 66,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    border: borders.thin,
    borderRadius: radii[4],
    background: colors.white,
    fontFamily: 'inherit',
    textAlign: 'left',
    color: colors.black,
    selectors: {
      '&[data-principal]': {
        minHeight: 70,
        border: borders.thick,
        background: colors.greenSoft,
        boxShadow: shadows.small,
      },
    },
  },
]);

export const opcionTile = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
});

export const opcionTextos = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
});

export const opcionLabel = style({
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
});

export const opcionHint = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const hecho = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  border: `2px solid ${colors.greenText}`,
  borderRadius: radii[3],
  background: colors.greenSoft,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const pie = style({
  flex: 'none',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 16,
  padding: '14px 24px',
  borderTop: borders.quiet,
  background: colors.offwhite,
  '@media': { [PHONE]: { padding: '12px 16px', gap: 10 } },
});

export const pieNota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const listo = style({
  marginLeft: 'auto',
  minHeight: 56,
  padding: '0 26px',
  fontSize: portalFontSizes.sectionTitle,
  boxShadow: shadows.card,
  '@media': { [PHONE]: { width: '100%', marginLeft: 0 } },
});
