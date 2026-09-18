import { keyframes, style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

const pop = keyframes({
  from: { opacity: 0, transform: 'translateY(10px) scale(0.98)' },
  to: { opacity: 1, transform: 'none' },
});

/** The confirmation card every operator screen shows after an action (xg-pop, 140 ms). */
export const toast = style({
  position: 'fixed',
  right: 32,
  bottom: 32,
  zIndex: 70,
  width: 'min(380px, calc(100vw - 32px))',
  overflow: 'hidden',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  background: colors.white,
  boxShadow: shadows.hero,
  animation: `${pop} 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
  '@media': {
    [PHONE]: { right: 16, bottom: 84 },
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

export const head = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  borderBottom: `2px solid ${colors.black}`,
});

export const title = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const body = style({
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const text = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

export const ok = style([
  pressable,
  {
    height: 44,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[2],
    background: colors.white,
    boxShadow: shadows.small,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.black,
  },
]);
