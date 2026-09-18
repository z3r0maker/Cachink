import { recipe } from '@vanilla-extract/recipes';
import { colors, radii, shadows } from '@xangarro/tokens';

/**
 * Global banner — dismissal is not offered while the condition holds.
 *
 * Severity always pairs a tone with an icon and a word; colour never carries
 * the meaning on its own (design plan §1.8).
 */
export const banner = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[4],
    boxShadow: shadows.card,
    padding: '16px 20px',
    flexWrap: 'wrap',
  },
  variants: {
    tone: {
      critical: { background: colors.redSoft },
      warning: { background: colors.warningSoft },
      info: { background: colors.blueSoft },
      success: { background: colors.greenSoft },
    },
  },
  defaultVariants: { tone: 'info' },
});
