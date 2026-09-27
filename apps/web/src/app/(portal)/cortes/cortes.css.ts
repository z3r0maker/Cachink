import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

const TABULAR = 'tabular-nums';

/** Dueño · Cortes de turno (CfgCortes): the head, the table's cells and the empty state. */
export const cabeza = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 16,
  flexWrap: 'wrap',
});

export const titulos = style({
  flex: '1 1 260px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const miga = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

/** Ink with its underline: blue on the page's gray would be 4.19:1, under AA. */
export const enlace = style({
  color: colors.black,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  selectors: { '&:hover': { color: colors.gray600 } },
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { '(max-width: 720px)': { fontSize: portalFontSizes.xl5 } },
});

export const subtitulo = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const turno = style({ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 });

export const avatar = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 42,
  height: 42,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nombre = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const linea = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: TABULAR,
  color: colors.gray600,
});

/** The signed difference: soft fill, its own ink, ringed in that ink. */
export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  border: '2px solid currentColor',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: TABULAR,
  whiteSpace: 'nowrap',
  selectors: { '&[data-estado]': { fontSize: portalFontSizes.xs } },
});

export const punto = style({
  width: 7,
  height: 7,
  borderRadius: shapeRadii.pill,
  background: 'currentColor',
});

export const vacio = style({
  padding: '36px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  textAlign: 'center',
});

export const vacioTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const vacioTexto = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const vacioBoton = style({
  minHeight: 44,
  padding: '0 16px',
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  cursor: 'pointer',
});
