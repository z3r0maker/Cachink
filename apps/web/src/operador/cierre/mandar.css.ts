import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/** «Mandar el corte a los patrones» (OpCierreCorte): the message, then the ways out. */
export const cuerpo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '18px 24px',
  overflowY: 'auto',
  '@media': { [PHONE]: { padding: 16 } },
});

/** «Así les llega»: the message one fact per line, as WhatsApp shows it. */
export const mensaje = style({
  margin: 0,
  padding: '14px 16px',
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.offwhite,
  whiteSpace: 'pre-line',
  lineHeight: 1.5,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.ink,
});

export const listo = style({ width: '100%', minHeight: 52 });
