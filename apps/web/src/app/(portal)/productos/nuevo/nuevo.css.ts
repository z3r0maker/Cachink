import { globalStyle, keyframes, style, styleVariants } from '@vanilla-extract/css';
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

/** «Nuevo producto» (ADR-107): the path on top, the question left, the tile right. */
export const pagina = style({ display: 'grid', gap: 20 });

export const migas = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

globalStyle(`${migas} a`, { color: colors.black });

export const cancelar = style({ marginLeft: 'auto' });

export const cabeza = style({ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' });

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
});

export const camino = style({
  display: 'flex',
  gap: 8,
  margin: 0,
  padding: 0,
  listStyle: 'none',
  flexWrap: 'wrap',
});

const paso = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 40,
  padding: '0 14px 0 6px',
  borderRadius: shapeRadii.pill,
  font: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  cursor: 'pointer',
} as const;

export const pasoBoton = styleVariants({
  actual: { ...paso, background: colors.yellow, border: borders.thin, color: colors.black },
  hecho: { ...paso, background: colors.white, border: borders.thin, color: colors.black },
  falta: {
    ...paso,
    background: colors.white,
    border: borders.quiet,
    color: colors.textMuted,
    cursor: 'default',
  },
});

export const pasoNum = style({
  display: 'grid',
  placeItems: 'center',
  width: 28,
  height: 28,
  borderRadius: shapeRadii.pill,
  background: colors.black,
  color: colors.yellow,
  fontSize: fontSizes.sm,
});

export const cuerpo = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)',
  gap: 22,
  alignItems: 'start',
  '@media': { 'screen and (max-width: 1023px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

const entra = keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'none' },
});

export const tarjeta = style({
  display: 'grid',
  gap: 22,
  padding: 28,
  background: colors.white,
  border: borders.thick,
  borderRadius: radii[6],
  boxShadow: shadows.card,
  animation: `${entra} 220ms ease-out`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
    'screen and (max-width: 767px)': { padding: 18 },
  },
});

export const error = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.redText,
});

export const acciones = style({ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 6 });

export const empuja = style({ marginLeft: 'auto' });

export const lado = style({ display: 'grid', gap: 18, position: 'sticky', top: 16 });

export const caja = style({
  display: 'grid',
  gap: 12,
  padding: 18,
  background: colors.offwhite,
  border: borders.quiet,
  borderRadius: radii[5],
});

export const cajaTitulo = style({
  margin: 0,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const cajaRejilla = style({
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr 1fr',
  gap: 10,
});

export const tile = style({
  display: 'grid',
  justifyItems: 'start',
  gap: 6,
  minHeight: 130,
  padding: 12,
  border: borders.thin,
  borderRadius: radii[3],
  boxShadow: shadows.small,
});

export const tileIcono = style({
  display: 'grid',
  placeItems: 'center',
  width: 44,
  height: 44,
  background: colors.white,
  border: borders.thin,
  borderRadius: radii[2],
});

export const tileNombre = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  lineHeight: 1.2,
  overflowWrap: 'anywhere',
});

export const tilePrecio = style({
  alignSelf: 'end',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const fantasma = style({
  minHeight: 130,
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[3],
  opacity: 0.6,
});
