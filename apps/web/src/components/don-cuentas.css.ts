import { recipe } from '@vanilla-extract/recipes';
import { borders, colors, shadows, shapeRadii } from '@xangarro/tokens';

/**
 * Don Cuentas' face: the brand coin (yellow, black border) wearing the
 * persona's glasses and mustache. Three sizes: `sm` rides inside a line of
 * text, `md` leads a card, `lg` heads the screen.
 */
export const avatar = recipe({
  base: {
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shapeRadii.pill,
    background: colors.yellow,
    border: borders.thin,
    color: colors.black,
  },

  variants: {
    size: {
      sm: { width: 22, height: 22 },
      md: { width: 40, height: 40, boxShadow: shadows.small },
      lg: { width: 56, height: 56, border: borders.thick, boxShadow: shadows.card },
    },
  },

  defaultVariants: { size: 'md' },
});
