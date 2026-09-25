import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  pressTransform,
  radii,
  shadows,
  typography,
} from '@xangarro/tokens';

/** The fields and the main button inside the vale. */

/* ─── Controls inside the ticket ─── */

export const inputWrap = style({ position: 'relative' });

export const inputIcon = style({
  position: 'absolute',
  left: 16,
  top: 16,
  width: 20,
  height: 20,
  color: colors.gray600,
  pointerEvents: 'none',
});

export const input = style({
  width: '100%',
  height: 52,
  padding: '0 16px 0 48px',
  border: borders.thin,
  borderRadius: radii[2],
  fontFamily: 'inherit',
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.semibold,
  color: colors.black,
  background: colors.white,
  selectors: {
    '&:focus': { outline: 'none', background: colors.yellowSoft, boxShadow: shadows.card },
    '&:focus-visible': { outline: 'none', boxShadow: shadows.card },
  },
});

export const inputWithToggle = style([input, { paddingRight: 56 }]);

export const reveal = style({
  position: 'absolute',
  right: 4,
  top: 4,
  width: 44,
  height: 44,
  border: 0,
  borderRadius: radii[1],
  background: 'transparent',
  color: colors.black,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
});

export const cta = style({
  height: 56,
  marginTop: 4,
  border: borders.thick,
  borderRadius: radii[3],
  background: colors.yellow,
  boxShadow: shadows.card,
  fontFamily: 'inherit',
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  cursor: 'pointer',
  selectors: {
    '&:active:not(:disabled)': { transform: pressTransform.to, boxShadow: shadows.pressed },
    '&:disabled': { opacity: 0.6, cursor: 'progress' },
  },
});
