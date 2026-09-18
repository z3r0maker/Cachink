import { keyframes, style } from '@vanilla-extract/css';
import { colors, fontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateX(24px)' },
  to: { opacity: 1, transform: 'none' },
});

/** Flat scrim — the only translucent value in the product. */
export const overlay = style({
  position: 'fixed',
  inset: 0,
  background: colors.scrim,
  animation: `${fadeIn} 160ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

/**
 * Detail drawer — full height, flush right, `min(460px, 100vw)`.
 *
 * Radix's Dialog supplies the focus trap and the Escape handler; the handoff
 * requires closing on backdrop, on the close button and on Escape, and all
 * three come from that primitive rather than from hand-rolled listeners.
 */
export const panel = style({
  position: 'fixed',
  top: 0,
  right: 0,
  height: '100vh',
  width: 'min(460px, 100vw)',
  display: 'flex',
  flexDirection: 'column',
  background: colors.white,
  borderLeft: `2.5px solid ${colors.black}`,
  animation: `${slideIn} 160ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  height: 76,
  flex: 'none',
  padding: '0 20px',
  borderBottom: `2.5px solid ${colors.black}`,
});

export const title = style({
  margin: 0,
  fontSize: fontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const closeButton = style([
  pressable,
  {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    flex: 'none',
    display: 'grid',
    placeItems: 'center',
    background: colors.white,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[2],
    boxShadow: 'none',
    fontSize: fontSizes.xl,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
  },
]);

export const body = style({ flex: 1, minHeight: 0, overflowY: 'auto', padding: 20 });

export const footer = style({
  flex: 'none',
  display: 'flex',
  gap: 10,
  padding: 20,
  borderTop: `2.5px solid ${colors.black}`,
  flexWrap: 'wrap',
});
