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
 * Cierre del mes (E-14, boards CD-10 and CD-10b): the progress bar, the
 * seven step rows (a pending one outlined, a done one flat), the closed
 * chip, the reopen request's banner and the year's months. A state is always
 * a word, never a colour alone.
 */
/** Seven segments, one per step: no computed width, which the console's CSP would drop. */
export const barra = style({ display: 'flex', gap: 4 });

const segmento = style({
  flex: '1 1 0',
  height: 12,
  border: borders.thin,
  borderRadius: shapeRadii.pill,
});

export const tramo = styleVariants({
  vacio: [segmento, { background: colors.gray100 }],
  hecho: [segmento, { background: colors.green }],
  cerrado: [segmento, { background: colors.black }],
});

export const progreso = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
});

export const pasos = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

const filaBase = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  borderRadius: radii[3],
});

export const fila = styleVariants({
  pendiente: [filaBase, { background: colors.white, border: borders.thin }],
  hecho: [filaBase, { background: colors.offwhite, border: borders.quiet }],
});

export const texto = style({
  flex: '1 1 260px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const fuente = style({
  flex: '0 0 auto',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.textMuted,
});

export const pie = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 14,
  paddingTop: 16,
  borderTop: borders.quiet,
});

export const nota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  maxWidth: 760,
});

/** «Cerrado» is black with yellow text, like a selected chip (CLAUDE.md §7). */
export const chipCerrado = style({ background: colors.black, color: colors.yellow });

export const banner = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  padding: '16px 18px',
  border: borders.thick,
  borderRadius: radii[4],
  background: colors.warningSoft,
  boxShadow: shadows.small,
});

export const bannerTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  maxWidth: 820,
});

export const comparacion = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
  padding: 14,
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const mesFila = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, 1fr) minmax(0, 3fr) auto',
  gap: 16,
  alignItems: 'center',
  padding: '12px 4px',
  borderTop: borders.quiet,
  color: colors.ink,
  textDecoration: 'none',
  '@media': { 'screen and (max-width: 640px)': { gridTemplateColumns: '1fr auto' } },
});
