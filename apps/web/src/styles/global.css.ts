import { globalStyle, style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

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
 * Headings have a house style, and it is not the browser's (S-3).
 *
 * "Headings: weight 800, letter-spacing `-0.02em` → `-0.04em`" — design
 * handoff, "Typography". The UA default is weight 700 at 2em with no
 * tracking, which is what the auth card, the onboarding wizard and every
 * other bare `<h1>` were rendering.
 *
 * These are element selectors, so any component that styles its own heading
 * still wins on specificity — this only catches the ones nobody dressed.
 * The margin goes to zero because the portal's layouts space themselves with
 * `gap`, and a UA margin on a flex child is a surprise, not a default.
 */
globalStyle('h1, h2, h3, h4, h5, h6', {
  margin: 0,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  lineHeight: 1.15,
  letterSpacing: typography.letterSpacing.tight,
  textWrap: 'pretty',
});

/** The page title: 36px/800/`-0.03em`/`line-height: 1.05` ("Main"). */
globalStyle('h1', {
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  letterSpacing: typography.letterSpacing.tighter,
});

globalStyle('h2', {
  fontSize: portalFontSizes.xl3,
  letterSpacing: typography.letterSpacing.tighter,
});

/** A card title, the design's smallest heading step ("Standard controls"). */
globalStyle('h3', { fontSize: portalFontSizes.cardTitle });

globalStyle('h4, h5, h6', { fontSize: portalFontSizes.lgx });

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
