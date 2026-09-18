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

/**
 * The console's handful of primitives. Deliberately few: the portal's
 * component set (`apps/portal/src/components`) is the real library, and
 * extracting it to a shared web package is an N-05 follow-up rather than a
 * copy made here.
 */
export const card = style({
  background: colors.white,
  border: borders.thick,
  borderRadius: radii[4],
  boxShadow: shadows.card,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  maxWidth: 560,
});

export const heading = style({
  margin: 0,
  fontSize: fontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const body = style({ margin: 0, fontSize: fontSizes.md, color: colors.ink });

export const muted = style({ margin: 0, fontSize: fontSizes.sm, color: colors.textMuted });

export const errorText = style({ margin: 0, fontSize: fontSizes.sm, color: colors.redText });

export const okText = style({ margin: 0, fontSize: fontSizes.sm, color: colors.greenText });

export const field = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const label = style({
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const input = style({
  minHeight: 44,
  padding: '0 12px',
  border: borders.thin,
  borderRadius: radii[2],
  fontSize: fontSizes.lg,
  fontFamily: 'inherit',
  background: colors.white,
  color: colors.black,
});

export const button = style({
  minHeight: 44,
  padding: '0 18px',
  border: borders.thick,
  borderRadius: radii[2],
  background: colors.yellow,
  color: colors.black,
  boxShadow: shadows.small,
  fontSize: fontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontFamily: 'inherit',
  cursor: 'pointer',
  alignSelf: 'flex-start',
  selectors: {
    '&:active:not(:disabled)': { transform: pressTransform.to, boxShadow: shadows.pressed },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const buttonQuiet = style([button, { background: colors.white }]);

/**
 * Forms stack their fields. A class, not a `style` prop: the CSP has no
 * `'unsafe-inline'`, so server-rendered `style=""` attributes would be dropped.
 */
export const stack = style({ display: 'flex', flexDirection: 'column', gap: 14 });

export const centered = style({
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 16,
});
