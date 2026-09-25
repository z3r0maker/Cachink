import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateX(60px)' },
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
  animation: `${slideIn} 280ms cubic-bezier(0.2, 0.8, 0.3, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

/** Eyebrow, status and close on one row; the title and its context line under it. */
export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flex: 'none',
  padding: '18px 24px 16px',
  borderBottom: borders.quiet,
});

export const headerTop = style({ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 });

export const eyebrow = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const title = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  textWrap: 'balance',
});

export const subtitle = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const closeButton = style([
  pressable,
  {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    flex: 'none',
    display: 'grid',
    placeItems: 'center',
    background: colors.white,
    border: borders.quiet,
    borderRadius: radii[2],
    boxShadow: 'none',
    color: colors.black,
    selectors: { '&:hover': { borderColor: colors.black } },
  },
]);

const pill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: shapeRadii.pill,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
} as const;

export const status = styleVariants({
  ok: {
    ...pill,
    background: colors.greenSoft,
    color: colors.greenText,
    border: `2px solid ${colors.greenText}`,
  },
  neutral: { ...pill, background: colors.gray100, color: colors.gray600, border: borders.quiet },
  warn: {
    ...pill,
    background: colors.warningSoft,
    color: colors.warningText,
    border: `2px solid ${colors.warningText}`,
  },
});

const dot = { width: 7, height: 7, borderRadius: shapeRadii.pill } as const;

export const statusDot = styleVariants({
  ok: { ...dot, background: colors.green },
  neutral: { ...dot, background: colors.gray400 },
  warn: { ...dot, background: colors.warning },
});

export const body = style({ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 24px' });

export const footer = style({
  flex: 'none',
  display: 'flex',
  gap: 10,
  padding: '16px 24px 20px',
  borderTop: borders.quiet,
  flexWrap: 'wrap',
});
