import { style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  dataviz,
  portalFontSizes,
  radii,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/**
 * Resultados' charts (E-12, board CD-07): the cascade, the EBITDA bridge and
 * the six-month trend. Bar colours come only from `dataviz` (ADR-133). Bars
 * are SVG rects: their place and size are attributes, which the console's
 * CSP allows, where an inline `style` attribute would be dropped.
 */
export const rol = styleVariants({
  ingreso: { background: dataviz.ingreso, fill: dataviz.ingreso },
  restante: { background: dataviz.restante, fill: dataviz.restante },
  perdida: { background: dataviz.perdida, fill: dataviz.perdida },
  impuesto: { background: dataviz.impuesto, fill: dataviz.impuesto },
  costoServicio: { background: dataviz.costoServicio, fill: dataviz.costoServicio },
  ventasMarketing: { background: dataviz.ventasMarketing, fill: dataviz.ventasMarketing },
  desarrollo: { background: dataviz.desarrollo, fill: dataviz.desarrollo },
  administracion: { background: dataviz.administracion, fill: dataviz.administracion },
});

export const leyenda = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
});

export const leyendaItem = style({ display: 'inline-flex', alignItems: 'center', gap: 6 });

export const muestra = style({ width: 12, height: 12, borderRadius: shapeRadii.mark });

export const cascadaScroll = style({ overflowX: 'auto' });

export const cascada = style({ display: 'flex', gap: 10, minWidth: 900, paddingTop: 8 });

export const columna = style({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const lienzo = style({
  position: 'relative',
  height: 280,
  borderBottom: borders.thin,
});

export const etiquetaBarra = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  textAlign: 'center',
  lineHeight: 1.25,
});

export const etiquetaTotal = style([etiquetaBarra, { fontWeight: typography.weights.extraBold }]);

export const valorBarra = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  textAlign: 'center',
  color: colors.ink,
});

export const notaBarra = style({
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  textAlign: 'center',
  color: colors.gray600,
});

export const puenteFila = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 170px) minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 12,
  padding: '6px 0',
  fontSize: portalFontSizes.sm,
});

export const puentePista = style({
  position: 'relative',
  height: 18,
  background: colors.gray100,
  borderRadius: radii[0],
  overflow: 'hidden',
});

export const tendencia = style({
  display: 'flex',
  minWidth: 0,
  alignItems: 'flex-end',
  gap: 14,
  height: 240,
  paddingTop: 24,
  borderBottom: borders.thin,
});

export const mes = style({
  flex: '1 1 0',
  minWidth: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 6,
});

/** An SVG that fills its box; its rects use a 0–100 viewBox stretched to fit. */
export const lleno = style({
  display: 'block',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
});

export const pareja = style({ flex: 1, width: '100%', minHeight: 0 });

export const meses = style({ display: 'flex', gap: 14 });

export const mesLabel = style({
  flex: '1 1 0',
  minWidth: 0,
  overflow: 'hidden',
  textAlign: 'center',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});
