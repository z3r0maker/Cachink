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

/** Logo, plantilla and colour controls (CfgComprobantes). */
export const logoFila = style({
  display: 'flex',
  gap: 14,
  alignItems: 'stretch',
  flexWrap: 'wrap',
});

export const logoTile = style({
  width: 84,
  height: 84,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  borderRadius: radii[4],
  background: colors.offwhite,
  border: borders.quiet,
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const logoImg = style({ maxWidth: 72, maxHeight: 72, objectFit: 'contain' });

export const soltar = style({
  flex: 1,
  minWidth: 'min(220px, 100%)',
  minHeight: 84,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '10px 18px',
  borderRadius: radii[4],
  border: borders.quiet,
  background: colors.white,
  cursor: 'pointer',
  selectors: {
    '&:hover, &[data-encima]': { background: colors.yellowSoft, borderColor: colors.black },
    '&:focus-within': { outline: `3px solid ${colors.blueText}`, outlineOffset: 2 },
  },
});

export const soltarIcono = style({
  width: 44,
  height: 44,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[2],
  background: colors.yellow,
  border: borders.thin,
  color: colors.black,
});

export const soltarTexto = style({ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 });

export const fuerte = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const oculto = style({
  position: 'absolute',
  width: 1,
  height: 1,
  opacity: 0,
  overflow: 'hidden',
});

export const cambiar = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  padding: '0 14px',
  borderRadius: radii[2],
  border: borders.thin,
  background: colors.white,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  cursor: 'pointer',
  selectors: { '&:focus-within': { outline: `3px solid ${colors.blueText}`, outlineOffset: 2 } },
});

export const plantillas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
  '@media': { '(max-width: 760px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
});

export const plantilla = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '10px 10px 12px',
  borderRadius: radii[4],
  border: borders.quiet,
  background: colors.white,
  textAlign: 'left',
  fontFamily: 'inherit',
  cursor: 'pointer',
  selectors: {
    '&:hover': { borderColor: colors.black },
    '&[aria-checked="true"]': {
      background: colors.yellowSoft,
      border: borders.thin,
      boxShadow: shadows.small,
    },
    '&:disabled': { cursor: 'default' },
  },
});

export const miniatura = style({
  height: 76,
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[1],
  background: colors.gray100,
});

export const plantillaNombre = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const plantillaDesc = style({
  fontSize: portalFontSizes.xs,
  lineHeight: 1.35,
  overflowWrap: 'anywhere',
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  selectors: {
    '&[data-recomendado]': { fontWeight: typography.weights.extraBold, color: colors.black },
  },
});

export const colores = style({ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' });

export const muestras = style({ display: 'flex', gap: 8, flexWrap: 'wrap' });

export const muestra = style({
  width: 44,
  height: 44,
  borderRadius: shapeRadii.pill,
  border: borders.thin,
  cursor: 'pointer',
  selectors: {
    '&[aria-checked="true"]': { boxShadow: `0 0 0 3px ${colors.white}, 0 0 0 5px ${colors.black}` },
    '&:disabled': { cursor: 'default' },
  },
});

export const separador = style({
  width: 2,
  height: 32,
  background: colors.gray200,
  margin: '0 4px',
});

export const hexCaja = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 48,
  boxSizing: 'border-box',
  padding: '0 12px',
  borderRadius: radii[2],
  border: borders.quiet,
  background: colors.white,
  selectors: {
    '&[data-propio]': { border: borders.thin, boxShadow: shadows.small },
    '&[data-mal]': { border: `2px solid ${colors.redText}`, background: colors.redSoft },
  },
});

export const gotero = style({
  width: 26,
  height: 26,
  padding: 0,
  border: borders.thin,
  borderRadius: radii[0],
  background: 'none',
  cursor: 'pointer',
});

export const hex = style({
  width: 92,
  border: 'none',
  outline: 'none',
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textTransform: 'uppercase',
  fontVariantNumeric: 'tabular-nums',
});
