import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/**
 * Socios › Trimestre (E-17, board CD-17b). Figures only. The motion the board
 * shows waits for the console's motion ADR (round 23), so nothing here moves.
 * «Exportar PDF» prints the summary alone: the shell and the buttons hide.
 */
export const hero = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: '24px 26px',
  border: borders.thick,
  borderRadius: radii[6],
  background: colors.white,
});

export const heroCabeza = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
});

export const heroTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const tiles = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
});

export const tile = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '14px 16px',
  borderRadius: radii[4],
  background: colors.offwhite,
});

export const tileValor = style({
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const tono = styleVariants({
  sube: { color: colors.greenText },
  baja: { color: colors.redText },
  igual: { color: colors.gray600 },
});

export const delta = style({ fontSize: portalFontSizes.sm, fontWeight: typography.weights.bold });

export const dos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
  gap: 20,
  alignItems: 'start',
});

export const tres = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: 20,
  alignItems: 'start',
});

export const trimestres = style({ display: 'flex', gap: 18, paddingTop: 8 });

export const trimestre = style({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
});

export const barras = style({ display: 'block', width: '70%', height: 200 });

export const etiqueta = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  textAlign: 'center',
});

export const nota = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textAlign: 'center',
});

export const eje = style({ stroke: colors.gray600, strokeWidth: 0.6 });

export const acumulado = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
});

export const marca = styleVariants({
  si: { background: colors.greenSoft, color: colors.greenText },
  no: { background: colors.redSoft, color: colors.redText },
  curso: { background: colors.gray100, color: colors.ink },
});

export const marcaBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const fila = style({
  display: 'grid',
  gridTemplateColumns: '28px minmax(0, 1fr)',
  gap: 10,
  padding: '10px 0',
  borderTop: borders.quiet,
});

export const pista = style({ display: 'block', width: '100%', height: 10 });

export const fondoPista = style({ fill: colors.gray100 });

export const alerta = style({ color: colors.redText, fontWeight: typography.weights.bold });

export const cuenta = style({
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

/** Printing: only the summary, one column, no shell or buttons. */
const IMPRIME = 'body:has(#resumen-trimestre)';
globalStyle(`${IMPRIME} *`, { '@media': { print: { visibility: 'hidden' } } });
globalStyle(`${IMPRIME} #resumen-trimestre, ${IMPRIME} #resumen-trimestre *`, {
  '@media': { print: { visibility: 'visible' } },
});
globalStyle(`${IMPRIME} #resumen-trimestre`, {
  '@media': { print: { position: 'absolute', top: 0, left: 0, width: '100%' } },
});
globalStyle(`${IMPRIME} [data-no-imprimir]`, { '@media': { print: { display: 'none' } } });
