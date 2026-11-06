import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The two rows at the bottom of Mi negocio (ElNegocio): download everything, delete the account. */
export const fila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
});

export const primera = style([fila, { marginTop: 6, paddingTop: 18, borderTop: borders.quiet }]);

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

/** «Eliminar mi cuenta»: a link that leads to the page, drawn as the red outline action. */
export const eliminar = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: 44,
  padding: '0 16px',
  borderRadius: radii[2],
  border: `2px solid ${colors.redText}`,
  background: colors.white,
  color: colors.redText,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  textDecoration: 'none',
  selectors: { '&:focus-visible': { outline: `3px solid ${colors.blueText}`, outlineOffset: 2 } },
});
