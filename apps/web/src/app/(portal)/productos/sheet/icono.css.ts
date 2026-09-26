import { keyframes, style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '@/styles/press.css';

/** The icon picker (ADR-107): the guess, big; ten common ones; the rest on request. */
const cambia = keyframes({
  from: { transform: 'scale(0.6) rotate(-12deg)' },
  to: { transform: 'none' },
});

export const bloque = style({ display: 'grid', gap: 12 });

export const actual = style({ display: 'flex', alignItems: 'center', gap: 14 });

export const grande = style({
  display: 'grid',
  placeItems: 'center',
  width: 64,
  height: 64,
  flex: 'none',
  background: colors.yellow,
  border: borders.thin,
  borderRadius: radii[3],
  boxShadow: shadows.small,
  animation: `${cambia} 350ms cubic-bezier(0.3, 1.5, 0.5, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const nota = style({
  display: 'grid',
  gap: 2,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const rejilla = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
  gap: 8,
});

export const opcion = style([
  pressable,
  {
    display: 'grid',
    placeItems: 'center',
    height: 48,
    background: colors.white,
    border: borders.quiet,
    borderRadius: radii[2],
    boxShadow: 'none',
    color: colors.black,
    selectors: {
      '&[aria-checked="true"]': {
        background: colors.yellow,
        border: borders.thin,
        boxShadow: shadows.pressed,
      },
    },
  },
]);

export const verTodos = style({
  justifySelf: 'start',
  padding: 0,
  background: 'none',
  border: 0,
  font: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'underline',
  cursor: 'pointer',
});
