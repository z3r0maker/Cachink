import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

/**
 * The shared text roles.
 *
 * Screens kept re-declaring the same uppercase eyebrow inline, which scattered
 * font-size literals that `design-lint` then flagged one at a time. Naming the
 * four roles once removes the temptation and keeps the type scale auditable.
 */
export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
});

/** The same eyebrow on a yellow or black surface, where gray600 would vanish. */
export const eyebrowOnDark = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.yellow,
});

export const eyebrowOnYellow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.black,
});

/** The plan-name style: uppercase, wider tracking, one step up. */
export const planLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
});

export const cardTitle = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const muted = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

/**
 * A section heading inside a drawer. The global `h1…h6` rule zeroes the UA
 * margin (S-3), so anything that leaned on it says what it wants instead.
 */
export const seccionDrawer = style({
  margin: '18px 0 10px',
  fontSize: portalFontSizes.cardTitle,
});
