import { globalStyle } from '@vanilla-extract/css';
import { colors, typography } from '@xangarro/tokens';
import { cssVars } from '@xangarro/tokens/css';

/**
 * Base styles for the console. Every value is a token (ADR-057); the `:root`
 * custom properties are generated from `@xangarro/tokens`, never typed here.
 */
globalStyle(':root', { vars: cssVars() });

globalStyle('html, body', {
  margin: 0,
  padding: 0,
  background: colors.gray200,
  color: colors.ink,
  // `next/font` self-hosts the faces (app/fonts.ts) as CSS variables.
  fontFamily: `var(--font-jakarta), ${typography.fontFamily}`,
  fontWeight: typography.weights.semibold,
  WebkitFontSmoothing: 'antialiased',
});

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });

globalStyle('*:focus-visible', {
  outline: `3px solid ${colors.yellow}`,
  outlineOffset: 1,
  boxShadow: `inset 0 0 0 2px ${colors.black}`,
});
