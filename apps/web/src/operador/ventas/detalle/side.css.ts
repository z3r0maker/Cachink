import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The drawer's body: the lines, the four tiles, and its notes. */
export const seccion = style({ display: 'flex', flexDirection: 'column', gap: 8 });

export const h3 = style({ margin: 0 });

export const linea = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const icono = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
  color: colors.black,
});

export const lineaTexto = style({ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' });

export const lineaNombre = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

const mono = { fontVariantNumeric: 'tabular-nums' } as const;

export const lineaDetalle = style({
  ...mono,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const lineaTotal = style({
  ...mono,
  flex: 'none',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const fichas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
});

export const ficha = style({
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  border: borders.quiet,
  borderRadius: radii[3],
  minWidth: 0,
});

export const fichaK = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.textMuted,
});

export const fichaV = style({
  ...mono,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  overflowWrap: 'anywhere',
});

const nota = {
  padding: '12px 14px',
  borderRadius: radii[3],
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.bold,
  color: colors.ink,
  textWrap: 'pretty',
} as const;

export const notaTono = styleVariants({
  cancelada: { ...nota, border: `2px solid ${colors.redText}`, background: colors.redSoft },
  fiado: { ...nota, border: `2px solid ${colors.warningText}`, background: colors.warningSoft },
  hecho: { ...nota, border: `2px solid ${colors.greenText}`, background: colors.greenSoft },
});

export const enlace = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const estado = style({
  padding: '16px 0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
