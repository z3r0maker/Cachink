import { keyframes, style } from '@vanilla-extract/css';
import { colors, fontSizes, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { line, monoStack, t } from '@/styles/theme.css';

import { PHONE } from './shell.css';

/**
 * The console on a phone (canvas CD-19, CD-19b): a top bar with «Menú», and
 * the rail itself in a drawer from the left, where the rail sits on desktop.
 */

const MOTION_OK = '(prefers-reduced-motion: no-preference)';

export const topbar = style({
  display: 'none',
  '@media': {
    [PHONE]: {
      position: 'sticky',
      top: 0,
      zIndex: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minHeight: 60,
      padding: '0 16px',
      borderBottom: line.thin,
      background: t.bg,
    },
  },
});

const squareButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minHeight: 44,
  border: line.thin,
  borderRadius: radii[0],
  background: t.surface,
  color: t.text,
  fontFamily: 'inherit',
  fontSize: fontSizes.md,
  fontWeight: typography.weights.bold,
  cursor: 'pointer',
} as const;

export const menuButton = style({ ...squareButton, flex: 'none', padding: '0 14px' });

export const closeButton = style({ ...squareButton, flex: 'none', width: 44 });

export const topBrand = style({ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 });

export const topWordmark = style({
  fontFamily: 'var(--font-anton), Impact, sans-serif',
  fontSize: portalFontSizes.xl3,
  lineHeight: 0.95,
  color: t.accent,
});

export const topBadge = style({
  fontFamily: monoStack,
  fontSize: portalFontSizes.tag,
  letterSpacing: typography.letterSpacing.widest,
  color: t.dim,
});

const slideIn = keyframes({ from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } });
const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

/** A native `<dialog>`, like the command palette: focus, Escape and the backdrop for free. */
export const drawer = style({
  position: 'fixed',
  inset: '0 auto 0 0',
  width: 'min(300px, calc(100vw - 48px))',
  maxWidth: 'none',
  height: '100dvh',
  maxHeight: 'none',
  margin: 0,
  padding: 0,
  border: 'none',
  borderRight: line.thin,
  background: t.bg,
  color: t.body,
  selectors: { '&::backdrop': { background: colors.scrim } },
  '@media': {
    [MOTION_OK]: {
      selectors: {
        '&[open]': { animation: `${slideIn} 280ms ease-out` },
        '&[open]::backdrop': { animation: `${fadeIn} 160ms ease-out` },
      },
    },
  },
});

export const drawerPanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minHeight: '100%',
  padding: '16px 14px',
  boxSizing: 'border-box',
});

export const drawerHead = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 8,
});
