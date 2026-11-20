import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, dataviz, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Caja (E-23, board CD-15c): the five tiles, the month-end chart (real bars,
 * projected ones in their tint, the reserve line), and the panels' rows.
 * Chart colours come only from `dataviz` (ADR-133); every bar carries its
 * value as text, so no colour is read alone.
 */
export const tiles = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 14,
});

const tileBase = style({
  background: colors.white,
  borderRadius: radii[5],
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
});

export const tile = styleVariants({
  hero: [tileBase, { border: borders.thick }],
  normal: [tileBase, { border: borders.quiet }],
});

export const valorHero = style({
  fontSize: portalFontSizes.display,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.03em',
});

export const valor = style({
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.02em',
});

export const barras = style({ display: 'flex', gap: 10, minWidth: 640 });

export const grafica = style({ position: 'relative', overflowX: 'auto' });

export const rect = styleVariants({
  real: { fill: dataviz.restante },
  proyectada: { fill: dataviz.proyeccion, stroke: dataviz.restante, strokeWidth: 0.6 },
  reserva: { stroke: dataviz.perdida, strokeWidth: 0.8 },
});

export const muestra = styleVariants({
  real: { width: 12, height: 12, background: dataviz.restante },
  proyectada: { width: 12, height: 12, background: dataviz.proyeccion, border: borders.thin },
  reserva: { width: 14, height: 3, background: dataviz.perdida },
});

export const escenarios = style({ display: 'flex', flexWrap: 'wrap', gap: 6 });

export const paneles = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
  gap: 20,
  alignItems: 'start',
});

const renglonBase = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  padding: '7px 0',
  fontSize: portalFontSizes.sm,
});

export const renglon = styleVariants({
  entra: [renglonBase, { borderTop: borders.quiet, color: colors.greenText }],
  sale: [renglonBase, { borderTop: borders.quiet }],
  total: [renglonBase, { borderTop: borders.thin, fontWeight: typography.weights.extraBold }],
  aparte: [renglonBase, { borderTop: borders.quiet, color: colors.textMuted }],
});

export const tarjeta = style({
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const pago = style({
  display: 'grid',
  gridTemplateColumns: '56px minmax(0, 1fr) auto',
  gap: 10,
  alignItems: 'center',
  padding: '8px 0',
  borderTop: borders.quiet,
  color: colors.ink,
  textDecoration: 'none',
});

export const totalPagos = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  paddingTop: 8,
  borderTop: borders.thin,
  fontWeight: typography.weights.extraBold,
});
