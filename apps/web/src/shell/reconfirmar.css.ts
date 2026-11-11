import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The re-ask dialog's body: the code, the 15-minute note, the way to a recovery code. */
export const cuerpo = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 14,
  marginTop: 14,
});

export const nota = style({
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: radii[2],
  background: colors.offwhite,
  border: borders.quiet,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});
