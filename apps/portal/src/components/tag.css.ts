import { recipe } from '@vanilla-extract/recipes';
import { colors, fontSizes, shapeRadii, typography } from '@xangarro/tokens';

/**
 * Tag — a full pill with a 2 px border and a pastel fill, not interactive.
 *
 * Severity is **never** carried by colour alone (design plan §1.8): callers
 * pair a tone with a word, and `StatusPill` adds a bordered dot.
 */
export const tag = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: `2px solid ${colors.black}`,
    borderRadius: shapeRadii.pill,
    padding: '3px 11px',
    fontSize: fontSizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.black,
    whiteSpace: 'nowrap',
  },

  variants: {
    tone: {
      neutral: { background: colors.gray100 },
      success: { background: colors.greenSoft },
      danger: { background: colors.redSoft },
      warning: { background: colors.warningSoft },
      info: { background: colors.blueSoft },
      brand: { background: colors.yellow },
      soft: { background: colors.yellowSoft },
      purple: { background: colors.purpleSoft },
      peach: { background: colors.peachSoft },
    },
  },

  defaultVariants: { tone: 'neutral' },
});

export const dot = recipe({
  base: {
    width: 11,
    height: 11,
    flex: 'none',
    border: `2px solid ${colors.black}`,
    borderRadius: shapeRadii.pill,
  },
  variants: {
    tone: {
      neutral: { background: colors.gray400 },
      success: { background: colors.green },
      danger: { background: colors.red },
      warning: { background: colors.warning },
      info: { background: colors.blue },
      brand: { background: colors.yellow },
      soft: { background: colors.yellowSoft },
      purple: { background: colors.purple },
      peach: { background: colors.cyan },
    },
  },
  defaultVariants: { tone: 'neutral' },
});
