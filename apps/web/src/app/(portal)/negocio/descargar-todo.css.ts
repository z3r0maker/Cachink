import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

/** «Descargar todo»: the button, and under it the line that says why it failed. */
export const pila = style({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
});

export const pilaCompleta = style([pila, { display: 'flex', alignItems: 'stretch' }]);

export const error = style({
  margin: 0,
  maxWidth: 360,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.redText,
});
