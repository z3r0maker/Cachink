import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** «Código de barras» with a reader (P-44, board EcPortalCodigo). */
export const bloque = style({ display: 'grid', gap: 8 });

const aviso = {
  display: 'grid',
  gap: 10,
  margin: 0,
  padding: '12px 14px',
  borderRadius: radii[3],
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
} as const;

/** «Leímos el código…»: the reader's Enter did not save. */
export const leido = style({
  ...aviso,
  background: colors.greenSoft,
  border: `2px solid ${colors.greenText}`,
  fontWeight: typography.weights.bold,
});

/** «Ese código ya lo tiene …»: another product has it. */
export const repetido = style({
  ...aviso,
  background: colors.redSoft,
  border: `2px solid ${colors.redText}`,
});

export const repetidoTitulo = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const acciones = style({ display: 'flex', gap: 8, flexWrap: 'wrap' });
