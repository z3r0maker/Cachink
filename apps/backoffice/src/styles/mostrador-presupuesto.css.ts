import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, dataviz, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Presupuesto (E-22, boards CD-15d and CD-15e): the warning tile, the bars by
 * category (spent in its `dataviz` colour, the projection in a quiet grey
 * behind it, the budget as a black marker), each founder's Límite, and the
 * requests outside the budget. Bars are SVG attributes: the console's CSP
 * drops inline styles.
 */
export const tileAviso = style({
  background: colors.warningSoft,
  border: borders.quiet,
  borderRadius: radii[5],
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
});

export const notaAviso = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.warningText,
});

export const linea = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(150px, 200px) minmax(0, 1fr) minmax(180px, 240px)',
  alignItems: 'center',
  gap: 14,
  padding: '10px 0',
  borderTop: borders.quiet,
  color: colors.ink,
  textDecoration: 'none',
  '@media': {
    'screen and (max-width: 720px)': { gridTemplateColumns: 'minmax(0, 1fr)', gap: 6 },
  },
});

export const nombre = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: typography.weights.bold,
});

export const pista = style({ display: 'block', width: '100%', height: 22, overflow: 'visible' });

export const barra = styleVariants({
  proyeccion: {
    fill: colors.gray200,
    stroke: colors.gray400,
    strokeWidth: 1,
    vectorEffect: 'non-scaling-stroke',
  },
  marca: { fill: colors.black },
});

export const muestraProyeccion = style({
  width: 12,
  height: 12,
  borderRadius: radii[0],
  border: borders.thin,
  background: colors.gray200,
});

export const muestraMarca = style({ width: 3, height: 14, background: colors.black });

export const cifras = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  textAlign: 'right',
});

export const sobre = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.warningText,
});

export const limite = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const limitePista = style({
  display: 'block',
  width: '100%',
  height: 10,
  border: borders.thin,
  borderRadius: radii[0],
  background: colors.white,
  overflow: 'hidden',
});

export const limiteAvance = style({ fill: dataviz.restante });

export const fila = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto auto',
  alignItems: 'center',
  gap: 10,
  padding: '10px 0',
  borderTop: borders.quiet,
});

export const solicitud = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '14px 16px',
  borderRadius: radii[3],
  border: borders.thin,
  background: colors.warningSoft,
});

export const encabezadoSolicitud = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  fontWeight: typography.weights.extraBold,
});

export const tabla = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: portalFontSizes.sm,
});

export const celda = style({ padding: '8px 6px', borderTop: borders.quiet, textAlign: 'right' });

export const celdaNombre = style([celda, { textAlign: 'left' }]);

export const celdaTotal = style([
  celda,
  { borderTop: borders.thin, fontWeight: typography.weights.extraBold },
]);
