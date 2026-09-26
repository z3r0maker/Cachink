import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** The big yellow confirm at the foot of each step (58 px, a native button). */
export const confirm = style([
  pressable,
  {
    height: 58,
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: 'uppercase',
    color: colors.black,
    selectors: {
      '&:hover:not(:disabled)': { background: colors.yellowDeep },
      '&:disabled': { background: colors.gray100 },
    },
  },
]);
