import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** A file input hidden inside its label, the label dressed as a secondary button. */
export const archivoOculto = style({ position: 'absolute', width: 1, height: 1, opacity: 0 });

/** The file input's label, dressed as a secondary button. */
export const botonArchivo = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 48,
  padding: '0 18px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: colors.yellowSoft },
    '&:focus-within': { outline: `3px solid ${colors.yellow}`, outlineOffset: 2 },
  },
});
