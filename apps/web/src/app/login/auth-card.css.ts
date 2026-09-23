import { style } from '@vanilla-extract/css';
import { portalFontSizes, typography } from '@xangarro/tokens';

/**
 * The signed-out card's title — «30px/800», design handoff, "Acceso" → form
 * card. Not the page-title step: this heading lives inside a 460px card, and
 * the global `h1` rule (S-3) would set it to 36.
 */
export const tituloAcceso = style({
  margin: '0 0 18px',
  fontSize: portalFontSizes.xl5,
  letterSpacing: typography.letterSpacing.tighter,
});
