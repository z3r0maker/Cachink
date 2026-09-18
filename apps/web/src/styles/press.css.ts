import { style } from '@vanilla-extract/css';
import { colors, pressTransform, shadows } from '@xangarro/tokens';

/**
 * The "stamp".
 *
 * The single most identifiable interaction in the product: on press an element
 * shifts `translate(2px, 2px)` and its shadow shrinks to `1px 1px 0`, over
 * ~100 ms. Motion is press-only — no hover translate, no scroll animation, no
 * shimmer. Cards get the one exception, `liftOnHover` below.
 *
 * Every value comes from `pressTransform`; nothing here is a literal.
 */
export const EASE = pressTransform.durationMs;

export const pressable = style({
  cursor: 'pointer',
  transitionProperty: 'transform, box-shadow',
  transitionDuration: `${pressTransform.durationMs}ms`,
  transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  selectors: {
    '&:active:not(:disabled)': {
      transform: pressTransform.to,
      boxShadow: shadows.pressed,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
});

/**
 * The only non-press motion in the product: a card lifts 1 px and its shadow
 * grows, over 120 ms.
 */
export const liftOnHover = style({
  transitionProperty: 'transform, box-shadow',
  transitionDuration: '120ms',
  transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  selectors: {
    '&:hover': {
      transform: 'translate(-1px, -1px)',
      boxShadow: `6px 6px 0 ${colors.black}`,
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
});
