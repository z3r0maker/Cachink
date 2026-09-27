import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** Mi negocio · Funciones (CfgFunciones): one table of switches. */
export const pila = style({ display: 'flex', flexDirection: 'column', gap: 16 });

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  padding: '18px 22px 8px',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
  '@media': { '(max-width: 520px)': { padding: '16px 14px 6px' } },
});

export const cabeza = style({
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  paddingBottom: 14,
  flexWrap: 'wrap',
});

export const cabezaTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  flex: 1,
  minWidth: 240,
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl2,
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

export const cuenta = style({ fontWeight: typography.weights.extraBold, color: colors.black });

export const don = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  maxWidth: 470,
  padding: '6px 14px 6px 6px',
  borderRadius: radii[4],
  background: colors.yellowSoft,
  border: borders.thin,
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const donCaja = style({
  width: 48,
  height: 48,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  borderRadius: radii[2],
  background: colors.white,
  border: borders.thin,
});

const MOVIL = '(max-width: 700px)';

export const fila = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 170px 120px 64px',
  gridTemplateAreas: '"nombre plan estado control"',
  gap: 12,
  alignItems: 'center',
  minHeight: 64,
  padding: '8px 0',
  borderBottom: `2px solid ${colors.gray100}`,
  '@media': {
    [MOVIL]: {
      gridTemplateColumns: 'minmax(0, 1fr) 64px',
      gridTemplateAreas: '"nombre control" "chips chips"',
      rowGap: 8,
    },
  },
});

export const encabezado = style([
  fila,
  {
    minHeight: 0,
    borderTop: borders.thin,
    borderBottom: borders.quiet,
    '@media': { [MOVIL]: { display: 'none' } },
  },
]);

export const colNombre = style({
  gridArea: 'nombre',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
});

/** Plan and estado: two columns on a desktop, one line of chips on a phone. */
export const chips = style({
  display: 'contents',
  '@media': { [MOVIL]: { gridArea: 'chips', display: 'flex', gap: 8, flexWrap: 'wrap' } },
});

export const colControl = style({ gridArea: 'control', display: 'flex', justifyContent: 'center' });

export const tile = style({
  width: 40,
  height: 40,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[1],
  color: colors.black,
  '@media': { [MOVIL]: { display: 'none' } },
});

export const nombreTexto = style({ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 });

export const nombre = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const desc = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const nota = styleVariants({
  gris: {
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
  },
  ambar: {
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.warningText,
  },
});

const pastilla = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  justifySelf: 'start',
  padding: '3px 10px',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
  textDecoration: 'none',
});

export const pill = styleVariants({
  plan: [pastilla, { background: colors.yellowSoft, color: colors.black, border: borders.thin }],
  upsell: [
    pastilla,
    {
      position: 'relative',
      background: colors.purpleSoft,
      color: colors.black,
      border: borders.thin,
      // A 44px target around a small pill.
      selectors: { '&::after': { content: '""', position: 'absolute', inset: '-12px -4px' } },
    },
  ],
  on: [
    pastilla,
    {
      background: colors.greenSoft,
      color: colors.greenText,
      border: `2px solid ${colors.greenText}`,
    },
  ],
  off: [pastilla, { background: colors.gray100, color: colors.gray600, border: borders.quiet }],
});

export const punto = styleVariants({
  on: { width: 7, height: 7, borderRadius: shapeRadii.pill, background: colors.green },
  off: { width: 7, height: 7, borderRadius: shapeRadii.pill, background: colors.gray400 },
});
