import { keyframes, style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateX(60px)' },
  to: { opacity: 1, transform: 'none' },
});

/**
 * The operator's right-hand panel (El Mostrador, `OpInventario` / `OpCobranza`):
 * a detail or a form slides in over the screen, full height, flush right.
 */
export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: colors.scrim,
  animation: `${fadeIn} 160ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const panel = style({
  position: 'fixed',
  zIndex: 61,
  top: 0,
  right: 0,
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  background: colors.white,
  borderLeft: borders.thick,
  outline: 'none',
  animation: `${slideIn} 280ms cubic-bezier(0.2, 0.8, 0.3, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const head = style({
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '18px 26px 16px',
  borderBottom: borders.quiet,
});

export const headTop = style({ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 });

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const close = style([
  pressable,
  {
    marginLeft: 'auto',
    flex: 'none',
    width: 44,
    height: 44,
    display: 'grid',
    placeItems: 'center',
    border: borders.quiet,
    borderRadius: radii[2],
    background: colors.white,
    color: colors.black,
    selectors: { '&:hover': { borderColor: colors.black } },
  },
]);

export const titleRow = style({ display: 'flex', alignItems: 'center', gap: 12 });
export const titleCol = style({ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 });

export const title = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  textWrap: 'balance',
});

export const titleMd = style([title, { fontSize: portalFontSizes.xl2, letterSpacing: '-0.02em' }]);

export const body = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '18px 26px',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
});

export const footer = style({
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 26px 20px',
  borderTop: borders.quiet,
  background: colors.offwhite,
});
