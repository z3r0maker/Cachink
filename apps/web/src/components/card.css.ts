import { recipe } from '@vanilla-extract/recipes';
import { borders, colors, radii, shadows } from '@xangarro/tokens';

import { liftOnHover } from '../styles/press.css';

/**
 * Card — always a border **and** a shadow.
 *
 * A border without a shadow reads as an input field; a shadow without a border
 * reads as native iOS, which is the wrong brand. Both together is the Xangarro
 * card (design-system README, "Component personality").
 *
 * `standard` is the everyday panel; `hero` is the flat-yellow headline surface
 * with the heavier border, larger radius and deeper shadow.
 *
 * `quiet` (ADR-107) is the one exception to the rule above: a read-only panel
 * — figures, lists, charts — with the gray edge and no shadow, so the black
 * border and shadow stay the sign of something you can act on.
 */
export const card = recipe({
  base: { background: colors.white, border: `2px solid ${colors.black}` },

  variants: {
    tone: {
      plain: { background: colors.white },
      hero: { background: colors.yellow },
      soft: { background: colors.yellowSoft },
      success: { background: colors.greenSoft },
      danger: { background: colors.redSoft },
      warning: { background: colors.warningSoft },
      info: { background: colors.blueSoft },
      muted: { background: colors.gray100 },
    },
    emphasis: {
      standard: { borderRadius: radii[4], boxShadow: shadows.card, padding: 20 },
      hero: {
        borderWidth: 2.5,
        borderRadius: radii[5],
        boxShadow: shadows.hero,
        padding: 28,
      },
      inset: { borderRadius: radii[2], boxShadow: 'none', padding: 16 },
      quiet: { border: borders.quiet, borderRadius: radii[6], boxShadow: 'none', padding: 20 },
    },
    interactive: { true: [liftOnHover, { cursor: 'pointer' }] },
  },

  defaultVariants: { tone: 'plain', emphasis: 'standard' },
});
