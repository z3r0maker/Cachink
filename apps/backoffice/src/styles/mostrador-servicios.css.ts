import { style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/**
 * Servicios (E-24, boards CD-18 to CD-18d): the tiles, the usage cards and
 * their six-month bars, the list, the cards that pay, and a service's page.
 * Bars are SVG rects sized by attribute (the console's CSP drops inline
 * `style`); a projection is its category's colour at a lighter strength,
 * always with «*» in its label, so it is never read by colour alone.
 */
export const tileAviso = style({ background: colors.warningSoft });

export const tarjetas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
  gap: 14,
});

export const tarjeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 16,
  borderRadius: radii[3],
  background: colors.offwhite,
  color: colors.ink,
  textDecoration: 'none',
  selectors: { '&:focus-visible': { outline: `3px solid ${colors.yellow}`, outlineOffset: 2 } },
});

export const tarjetaCabeza = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 8,
});

export const nombre = style({
  display: 'block',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const para = style({
  display: 'block',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const tendencia = styleVariants({
  sube: { background: colors.warningSoft, color: colors.warningText },
  neutra: { background: colors.gray100, color: colors.ink },
});

export const chipBase = style({
  padding: '4px 10px',
  borderRadius: radii[1],
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
});

export const barras = style({ position: 'relative', height: 90, borderBottom: borders.thin });

export const barrasGrande = style([barras, { height: 240 }]);

export const meses = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 6,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  textAlign: 'center',
});

export const valores = style([meses, { color: colors.black }]);

export const proyectada = style({ fillOpacity: 0.4, opacity: 0.4 });

export const lineaAviso = style({ fill: colors.black });

export const resumen = style({ fontSize: portalFontSizes.sm, fontWeight: typography.weights.bold });

export const nota = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const notaAviso = style([
  nota,
  { color: colors.warningText, fontWeight: typography.weights.extraBold },
]);

export const punto = style({
  display: 'inline-block',
  width: 10,
  height: 10,
  marginRight: 6,
  borderRadius: shapeRadii.mark,
  verticalAlign: 'middle',
});

export const medios = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
  gap: 12,
});

export const medio = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '14px 16px',
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const columnas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
  gap: 20,
  alignItems: 'start',
});

export const gasto = style({
  display: 'grid',
  gridTemplateColumns: '72px minmax(0, 1fr) auto',
  gap: 12,
  alignItems: 'center',
  padding: '10px 0',
  borderTop: borders.quiet,
  color: colors.ink,
  textDecoration: 'none',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
});

export const plantilla = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '14px 16px',
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const casilla = style({ background: colors.yellowSoft, border: 'none' });

export const destacado = style({ border: borders.thick, boxShadow: shadows.card });
