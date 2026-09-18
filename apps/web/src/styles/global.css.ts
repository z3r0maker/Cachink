import { globalStyle, style } from '@vanilla-extract/css';
import { colors, typography } from '@xangarro/tokens';

import './tokens.css';

globalStyle('html, body', {
  margin: 0,
  padding: 0,
  // The page ground is deliberately darker than the app's offwhite so that
  // white cards read as floating panels (design handoff, "Main").
  background: colors.gray200,
  color: colors.ink,
  // `next/font` self-hosts the face and exposes it as `--font-jakarta`;
  // the token value is the fallback if the variable is ever missing.
  fontFamily: `var(--font-jakarta), ${typography.fontFamily}`,
  fontWeight: typography.weights.semibold,
  WebkitFontSmoothing: 'antialiased',
});

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });

/**
 * Focus is always visible: a yellow ring with a black inner edge so it reads on
 * white and on yellow alike. Elements sitting **on** yellow invert it.
 */
globalStyle('*:focus-visible', {
  outline: `3px solid ${colors.yellow}`,
  outlineOffset: 1,
  boxShadow: `inset 0 0 0 2px ${colors.black}`,
});

globalStyle('[data-onyellow]:focus-visible', {
  outline: `3px solid ${colors.black}`,
  outlineOffset: 2,
  boxShadow: 'none',
});

/** All motion in this product is opt-out. */
globalStyle('@media (prefers-reduced-motion: reduce)', {});

/** Visually hidden but available to assistive technology. */
export const srOnly = style({
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});

/**
 * Print (P-34): a statement or a list prints as the document, not the app —
 * no sidebar, no header, no buttons, no shadows, black on white. Anything
 * else interactive opts out with `data-no-print`.
 */
globalStyle('aside, header, button, [data-no-print]', {
  '@media': { print: { display: 'none !important' } },
});
globalStyle('html, body, main', {
  '@media': { print: { background: 'white', color: 'black' } },
});
globalStyle('main *', {
  '@media': { print: { boxShadow: 'none !important' } },
});
