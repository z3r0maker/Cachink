import { style, styleVariants } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Resultados (E-12, board CD-07): the selectors under the title, the panels'
 * headings, the statement's rows and the movements an opened line shows.
 */
export const controles = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
});

export const explica = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const titular = style({
  margin: 0,
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.02em',
});

export const tituloPanel = style({
  margin: 0,
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
});

export const encabezadoPanel = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 12,
});

export const dos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
  gap: 18,
  alignItems: 'start',
});

export const subtotal = style({ background: colors.offwhite });

export const nombre = style({ fontWeight: typography.weights.bold });
export const nombreSubtotal = style({ fontWeight: typography.weights.extraBold });

export const abrir = style({
  color: colors.ink,
  fontWeight: typography.weights.bold,
  textDecoration: 'none',
  selectors: { '&:hover': { textDecoration: 'underline' } },
});

export const negativo = style({ color: colors.redText });

export const tono = styleVariants({
  bien: { color: colors.greenText },
  mal: { color: colors.redText },
  igual: { color: colors.gray600 },
});

export const hijo = style({ paddingLeft: 40, fontWeight: typography.weights.semibold });

export const fechaHijo = style({
  display: 'inline-block',
  minWidth: 92,
  color: colors.gray600,
  fontSize: portalFontSizes.sm,
});

export const aviso = style({
  margin: 0,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.warningSoft,
  color: colors.warningText,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
});
