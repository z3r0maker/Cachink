import { globalStyle, style } from '@vanilla-extract/css';
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

import { pressable } from '@/styles/press.css';

/** «Ayuda» (ADR-107): Don's question on yellow, answers left, guides and the form right. */
export const portada = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 24,
  padding: '24px 28px',
  background: colors.yellow,
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.card,
  '@media': {
    'screen and (max-width: 767px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: 18,
    },
  },
});

export const portadaTexto = style({ flex: 1, display: 'grid', gap: 12, minWidth: 0 });

export const h1 = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
});

export const busca = style({
  width: '100%',
  height: 56,
  padding: '0 18px',
  background: colors.white,
  border: borders.thick,
  borderRadius: radii[4],
  font: 'inherit',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.semibold,
  boxSizing: 'border-box',
});

export const chips = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
});

export const chip = style([
  pressable,
  {
    padding: '6px 12px',
    background: colors.white,
    border: borders.thin,
    borderRadius: shapeRadii.pill,
    boxShadow: 'none',
    font: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
]);

export const cuerpo = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.5fr) minmax(300px, 1fr)',
  gap: 22,
  marginTop: 22,
  alignItems: 'start',
  '@media': { 'screen and (max-width: 1023px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const columna = style({ display: 'grid', gap: 22 });

export const titulo = style({
  margin: '0 0 12px',
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const temas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: 10,
});

const tarjeta = {
  display: 'grid',
  gap: 2,
  padding: '14px 16px',
  textAlign: 'left',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[4],
  font: 'inherit',
  color: colors.black,
  cursor: 'pointer',
} as const;

export const tema = style({
  ...tarjeta,
  selectors: {
    '&:hover': { borderColor: colors.black },
    '&[aria-pressed="true"]': { background: colors.yellowSoft, border: borders.thin },
  },
});

export const guia = style({ ...tarjeta, selectors: { '&:hover': { borderColor: colors.black } } });

export const temaLabel = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
});

export const temaCuenta = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const lista = style({ display: 'grid', gap: 8 });

export const pregunta = style({
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[4],
  selectors: { '&[data-abierta="true"]': { background: colors.yellowSoft, border: borders.thin } },
});

export const preguntaBoton = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '14px 16px',
  background: 'none',
  border: 0,
  font: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  textAlign: 'left',
  color: colors.black,
  cursor: 'pointer',
});

export const respuesta = style({
  padding: '0 16px 14px',
  fontSize: portalFontSizes.body,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
});

globalStyle(`${respuesta} p`, { margin: '0 0 8px' });
globalStyle(`${respuesta} a`, { color: colors.black, fontWeight: typography.weights.extraBold });

export const nada = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const caja = style({
  display: 'grid',
  gap: 10,
  padding: 20,
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
});

export const privacidad = style({
  margin: '8px 0 0',
  fontSize: portalFontSizes.sm,
  lineHeight: 1.5,
});
