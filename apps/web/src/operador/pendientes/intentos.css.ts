import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

/** DS-05/DS-07 on Registros por enviar (EsCajaReintentando). */

/** «El servidor está ocupado; reintentamos solos.»: bold, under the title. */
export const ayuda = style({
  margin: 0,
  lineHeight: 1.4,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

/** What the retry did, in the hero's own warning ink. */
export const estado = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.warningText,
});

/** «Último intento: hace 3 min · Próximo: en 2 min». */
export const linea = style({
  lineHeight: 1.4,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.textMuted,
});
