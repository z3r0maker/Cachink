import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** The back link detail screens show in place of the business pill (44 px + borders). */
export const back = style([
  pressable,
  {
    boxSizing: 'content-box',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    height: 44,
    padding: '0 14px',
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.white,
    boxShadow: shadows.small,
    color: colors.black,
    textDecoration: 'none',
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
]);
