import { recipe } from '@vanilla-extract/recipes';
import { colors, fontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

/**
 * Button — six fills, two sizes, one set of mechanics.
 *
 * Geometry is fixed by the design handoff: 48 px tall, `radius 16`, `2.5px`
 * border, `4px 4px 0` shadow, label 13px/700 uppercase with `0.08em` tracking.
 * Only the fill changes between variants. The small size drops to `radius 12`
 * and `3px 3px 0`.
 *
 * Hover darkening yellow to `yellowDeep` is the **only** permitted hover colour
 * change in the product.
 */
export const button = recipe({
  base: [
    pressable,
    {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      border: `2.5px solid ${colors.black}`,
      borderRadius: radii[4],
      boxShadow: shadows.card,
      fontFamily: typography.fontFamily,
      fontSize: fontSizes.sm,
      fontWeight: typography.weights.bold,
      letterSpacing: typography.letterSpacing.widest,
      textTransform: 'uppercase',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    },
  ],

  variants: {
    variant: {
      primary: {
        background: colors.yellow,
        color: colors.black,
        selectors: { '&:hover:not(:disabled)': { background: colors.yellowDeep } },
      },
      secondary: { background: colors.white, color: colors.black },
      dark: { background: colors.black, color: colors.white },
      danger: { background: colors.redSoft, color: colors.redText },
      soft: { background: colors.yellowSoft, color: colors.black },
      ghost: { background: 'transparent', color: colors.black, boxShadow: 'none' },
    },
    size: {
      md: { height: 48, padding: '0 20px' },
      sm: {
        height: 46,
        padding: '0 18px',
        borderWidth: 2,
        borderRadius: radii[2],
        boxShadow: shadows.small,
        fontSize: fontSizes.xs,
        letterSpacing: typography.letterSpacing.wider,
      },
      lg: { height: 52, padding: '0 24px' },
    },
    full: { true: { width: '100%' } },
  },

  defaultVariants: { variant: 'primary', size: 'md' },
});
