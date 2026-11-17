import { style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  dataviz,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/**
 * Límites del año (E-15, board CD-12d): the Resumen tile that opens it, the
 * drawer, its two gauges with their 60/80/95 lines, the sources and the caps
 * per year. Gauges are SVG rects, sized by attribute: the console's CSP drops
 * inline `style`.
 */
export const tile = styleVariants({
  abre: { border: borders.thick, boxShadow: shadows.card },
  aviso: { border: borders.thick, boxShadow: shadows.card, background: colors.warningSoft },
});

export const cajon = style({
  margin: '0 0 0 auto',
  width: 'min(600px, 100vw)',
  maxWidth: '100vw',
  height: '100dvh',
  maxHeight: '100dvh',
  padding: '28px 30px',
  boxSizing: 'border-box',
  border: 'none',
  borderLeft: borders.thick,
  background: colors.white,
  color: colors.ink,
  overflowY: 'auto',
  selectors: { '&::backdrop': { background: colors.scrim } },
});

export const cuerpo = style({ display: 'flex', flexDirection: 'column', gap: 20 });

export const cabeza = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.03em',
});

export const cerrar = style({
  flex: '0 0 auto',
  width: 40,
  height: 40,
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
});

export const medidor = style({
  padding: '18px 20px',
  borderRadius: radii[4],
  background: colors.offwhite,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const medidorCabeza = style([cabeza]);

export const subtitulo = style({
  margin: 0,
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
});

export const pct = style({
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
});

export const pista = style({
  display: 'block',
  width: '100%',
  height: 22,
  border: borders.thin,
  borderRadius: radii[0],
  background: colors.white,
  overflow: 'hidden',
});

export const marca = styleVariants({
  avance: { fill: dataviz.restante },
  proyeccion: { fill: dataviz.proyeccion },
  linea: { fill: colors.black },
});

/** The scale under a gauge: columns of 60, 20, 15 and 5 put each label on its line. */
export const escala = style({
  display: 'grid',
  gridTemplateColumns: '60fr 20fr 15fr 5fr',
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const marcaEscala = style({ transform: 'translateX(-50%)' });

export const leyenda = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 14,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
});

export const leyendaItem = style({ display: 'inline-flex', alignItems: 'center', gap: 6 });

export const nota = style({
  margin: 0,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const muestra = styleVariants({
  avance: { width: 12, height: 12, borderRadius: shapeRadii.markLg, background: dataviz.restante },
  proyeccion: {
    width: 12,
    height: 12,
    borderRadius: shapeRadii.markLg,
    background: dataviz.proyeccion,
  },
});

export const alerta = styleVariants({
  info: { background: colors.blueSoft, color: colors.blueText },
  warn: { background: colors.warningSoft, color: colors.warningText },
  bad: { background: colors.redSoft, color: colors.redText },
});

export const alertaBase = style({
  padding: '12px 14px',
  borderRadius: radii[2],
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
});

export const alertaTitulo = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const fila = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 12,
  padding: '8px 0',
  borderTop: borders.quiet,
  fontSize: portalFontSizes.sm,
});

export const filaTopes = style([
  fila,
  { gridTemplateColumns: '60px minmax(0, 1fr) minmax(0, 1fr)' },
]);

export const falta = style({ fontWeight: typography.weights.extraBold, color: colors.warningText });

export const captura = style({
  padding: '18px 20px',
  borderRadius: radii[4],
  border: borders.thin,
  background: colors.warningSoft,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
});
