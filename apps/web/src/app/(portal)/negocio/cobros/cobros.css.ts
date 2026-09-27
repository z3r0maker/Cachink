import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/** Mi negocio · Cobros (CfgCobros): one card per way of getting paid. */
export const pila = style({ display: 'flex', flexDirection: 'column', gap: 16 });

export const cabeza = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 16,
  flexWrap: 'wrap',
  marginTop: 4,
});

export const cabezaTexto = style({ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 });

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const sub = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const cuenta = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 40,
  padding: '0 14px',
  borderRadius: shapeRadii.pill,
  background: colors.white,
  border: borders.quiet,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const cuentaNum = style({ color: colors.black, fontVariantNumeric: 'tabular-nums' });

export const columnas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
  alignItems: 'start',
  '@media': { '(max-width: 900px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const columna = style({ display: 'flex', flexDirection: 'column', gap: 16 });

const sacude = keyframes({
  '0%, 100%': { transform: 'translateX(0)' },
  '25%': { transform: 'translateX(-4px)' },
  '75%': { transform: 'translateX(4px)' },
});

const tarjeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '16px 18px 16px 20px',
  borderRadius: radii[6],
  selectors: { '&[data-error]': { animation: `${sacude} .32s ease` } },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      selectors: { '&[data-error]': { animation: 'none' } },
    },
    '(max-width: 520px)': { padding: '14px 14px 14px 16px' },
  },
});

export const card = styleVariants({
  on: [tarjeta, { background: colors.white, border: borders.thin, boxShadow: shadows.small }],
  off: [tarjeta, { background: colors.offwhite, border: borders.quiet }],
});

export const cardFila = style({ display: 'flex', alignItems: 'center', gap: 14 });

export const icono = style({
  width: 48,
  height: 48,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[3],
  color: colors.black,
});

export const cardTexto = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const cardTitulo = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
});

export const nombre = style({
  margin: 0,
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const desc = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

const etiqueta = style({
  padding: '2px 9px',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const tag = styleVariants({
  on: [
    etiqueta,
    {
      background: colors.greenSoft,
      color: colors.greenText,
      border: `2px solid ${colors.greenText}`,
    },
  ],
  off: [etiqueta, { background: colors.gray100, color: colors.gray600, border: borders.quiet }],
});

export const control = style({
  flex: 'none',
  minWidth: 60,
  minHeight: 44,
  display: 'grid',
  placeItems: 'center',
});

export const alerta = style({
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  borderRadius: radii[2],
  background: colors.redSoft,
  border: `2px solid ${colors.redText}`,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const abierto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  paddingTop: 14,
  borderTop: `2px solid ${colors.gray100}`,
});

export const notaAmbar = style({
  margin: 0,
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: '10px 12px',
  borderRadius: radii[2],
  background: colors.warningSoft,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.black,
});

export const pie = style({
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const plan = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  padding: '0 12px',
  borderRadius: radii[2],
  background: colors.purpleSoft,
  border: borders.thin,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
});

export const enlace = style({ fontWeight: typography.weights.extraBold, color: colors.black });
