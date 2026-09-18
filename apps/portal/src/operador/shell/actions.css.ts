import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** A white header action (Avisos' «Marcar todo como leído»): a native button, 44 px. */
export const plainAction = style([
  pressable,
  {
    height: 44,
    padding: '0 16px',
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.white,
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: colors.black,
  },
]);

/** Caja's «Ventas del turno 12»: a white pill, not a link. */
export const stat = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  padding: '7px 14px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
});

export const statValue = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});
