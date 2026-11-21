import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

import { tarjeta } from './formulario.css';

/** «Escríbele al equipo» (P-48, board `RpAyuda`): the page around the form, and «Enviado». */

/** «Enviado»: Don celebrates, the promise, and the way back. */
export const enviado = style([
  tarjeta,
  { alignItems: 'center', gap: 12, padding: '32px 28px', textAlign: 'center' },
]);

export const enviadoTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const enviadoTexto = style({
  margin: '0 0 8px',
  maxWidth: 520,
  fontSize: portalFontSizes.lg,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  overflowWrap: 'anywhere',
});

/** The page: the form at its own width, Don's note beside it. */
export const pagina = style({ display: 'flex', flexDirection: 'column', gap: 16 });

export const cuerpo = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 820px) minmax(0, 1fr)',
  gap: 22,
  alignItems: 'start',
  '@media': { 'screen and (max-width: 1023px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const donTitulo = style({
  display: 'block',
  marginBottom: 4,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});
