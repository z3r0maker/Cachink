import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** Ventas y gastos' DS-01 pieces: the period caption, the search hint, the error row, «Ir a fecha». */
export const caption = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  margin: 0,
  paddingLeft: 6,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const enPeriodo = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.textMuted,
});

export const tabsFila = style({ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' });

export const buscador = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  flex: '1 1 280px',
  minWidth: 280,
});

export const pista = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  margin: 0,
  paddingLeft: 4,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.warningText,
});

export const filaError = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '4px 6px 4px 14px',
  borderRadius: radii[3],
  background: colors.redSoft,
  border: `2px solid ${colors.redText}`,
  color: colors.redText,
});

export const filaErrorTexto = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const reintentar = style({
  minHeight: 44,
  padding: '0 12px',
  border: 0,
  background: 'none',
  fontFamily: typography.fontFamily,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.redText,
  textDecoration: 'underline',
  cursor: 'pointer',
});

export const irAFecha = style({ display: 'flex', alignItems: 'center', gap: 10 });

export const irAFechaLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
});

export const irAFechaCampo = style({
  height: 44,
  padding: '0 10px',
  borderRadius: radii[2],
  border: borders.quiet,
  background: colors.white,
  fontFamily: typography.fontFamily,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});
