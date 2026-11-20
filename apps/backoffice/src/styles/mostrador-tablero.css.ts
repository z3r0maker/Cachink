import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * The Tablero (E-20, boards CD-13b to CD-13d): the banner, each partner's
 * tile with its bar to the 50 % line, the objectives, the plan's table and
 * the kanban. A state is always a word on a chip, never a colour alone.
 */
export const banner = styleVariants({
  ok: { background: colors.greenSoft },
  info: { background: colors.blueSoft },
  warn: { background: colors.warningSoft },
  bad: { background: colors.redSoft },
  off: { background: colors.white },
});

export const bannerBase = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  padding: '16px 20px',
  border: borders.thick,
  borderRadius: radii[6],
});

export const bannerTitulo = style({
  display: 'block',
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const bannerTexto = style({
  display: 'block',
  marginTop: 4,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const pista = style({ display: 'block', width: '100%', height: 26, overflow: 'visible' });

export const barra = styleVariants({
  fondo: { fill: colors.gray100 },
  aceptado: { fill: colors.green },
  revision: { fill: colors.yellow },
  linea: { stroke: colors.black, strokeWidth: 2, strokeDasharray: '4 3' },
});

export const leyenda = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const aviso = style({
  padding: '12px 16px',
  border: borders.thin,
  borderColor: colors.warningText,
  borderRadius: radii[4],
  background: colors.warningSoft,
  color: colors.warningText,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
});

export const kanban = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14,
  alignItems: 'start',
});

export const columna = styleVariants({
  por_hacer: { background: colors.gray100 },
  en_curso: { background: colors.gray100 },
  en_revision: { background: colors.yellowSoft },
  terminado: { background: colors.greenSoft },
});

export const columnaBase = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 12,
  borderRadius: radii[6],
});

export const columnaTitulo = style({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const tarjeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 12,
  border: borders.thin,
  borderRadius: radii[4],
  background: colors.white,
  color: colors.black,
  textDecoration: 'none',
  selectors: { '&:hover': { borderColor: colors.black } },
});

export const tarjetaCabeza = style({ display: 'flex', justifyContent: 'space-between', gap: 8 });

export const tarjetaTitulo = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
});

export const tarjetaCriterio = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.medium,
  color: colors.ink,
});

export const tarjetaPie = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const clase = styleVariants({
  entregable: { background: colors.yellow, color: colors.black },
  tarea: { background: colors.gray100, color: colors.ink },
  obligacion: { background: colors.blueSoft, color: colors.blueText },
});

export const estado = style({
  padding: '6px 8px',
  borderRadius: radii[0],
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
});

export const objetivo = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 12,
  padding: '12px 0',
  borderTop: borders.quiet,
});

export const fila = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 10,
  padding: '10px 0',
  borderTop: borders.quiet,
});

export const tabla = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: portalFontSizes.md,
});

export const celda = style({ padding: '10px 6px', borderTop: borders.quiet, textAlign: 'right' });

export const celdaTexto = style([celda, { textAlign: 'left' }]);

export const historia = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const cita = style({
  margin: 0,
  padding: '12px 16px',
  borderLeft: borders.thick,
  background: colors.offwhite,
  fontSize: portalFontSizes.md,
  whiteSpace: 'pre-wrap',
});

export const area = style({
  width: '100%',
  minHeight: 96,
  padding: 12,
  border: borders.thin,
  borderRadius: radii[2],
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  resize: 'vertical',
});
