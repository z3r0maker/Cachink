import { style, styleVariants } from '@vanilla-extract/css';
import { fontSizes, typography } from '@xangarro/tokens';

/**
 * The code field of the second factor (N-83): the regular input, with its
 * digits large, centred and evenly spaced so six of them read at a glance.
 * A recovery code is longer, so it is set smaller and tighter.
 */
const base = {
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: typography.weights.extraBold,
} as const;

export const codigo = styleVariants({
  app: { ...base, fontSize: fontSizes.xl3, letterSpacing: typography.letterSpacing.widest },
  recuperacion: { ...base, fontSize: fontSizes.lg, letterSpacing: typography.letterSpacing.wide },
});

/** The field's own bottom margin is the group's; a card that stacks with `gap` drops it. */
export const sinMargen = style({ marginBottom: 0 });
