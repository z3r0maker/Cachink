import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The three questions of «Nuevo producto» (ADR-107). */
export const grupo = style({ display: 'grid', gap: 20 });

export const campo = style({ display: 'grid', gap: 10 });

export const etiqueta = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const dos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
  '@media': { 'screen and (max-width: 599px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const chips = style({ display: 'flex', gap: 8, flexWrap: 'wrap' });

const tira = {
  margin: 0,
  padding: '12px 16px',
  borderRadius: radii[3],
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
} as const;

export const ganancia = styleVariants({
  bien: { ...tira, background: colors.greenSoft, color: colors.greenText },
  mal: { ...tira, background: colors.redSoft, color: colors.redText },
  nada: { ...tira, background: colors.offwhite, color: colors.gray600 },
});

export const mas = style({ borderTop: borders.quiet, paddingTop: 14 });

export const masResumen = style({
  cursor: 'pointer',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  marginBottom: 14,
});

export const interruptor = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  cursor: 'pointer',
});

export const sub = style({
  display: 'block',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const nota = style({
  margin: 0,
  padding: '12px 16px',
  background: colors.yellowSoft,
  borderRadius: radii[3],
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
});
