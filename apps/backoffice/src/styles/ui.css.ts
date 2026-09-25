import { style } from '@vanilla-extract/css';
import { fontSizes, pressTransform, radii, typography } from '@xangarro/tokens';

import { line, shade, t } from './theme.css';

/**
 * The console's handful of primitives. Deliberately few: the portal's
 * component set (`apps/web/src/components`) is the real library, and
 * extracting it to a shared web package is an N-05 follow-up rather than a
 * copy made here.
 */
export const card = style({
  background: t.surface,
  border: line.thick,
  borderRadius: radii[4],
  boxShadow: `4px 4px 0 ${t.line}`,
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
  color: t.text,
});

export const body = style({ margin: 0, fontSize: fontSizes.md, color: t.body });

export const muted = style({ margin: 0, fontSize: fontSizes.sm, color: t.dim });

export const errorText = style({ margin: 0, fontSize: fontSizes.sm, color: t.bad });

export const okText = style({ margin: 0, fontSize: fontSizes.sm, color: t.ok });

export const field = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const label = style({
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
  color: t.dim,
});

export const input = style({
  minHeight: 44,
  padding: '0 12px',
  border: line.thin,
  borderRadius: radii[2],
  fontSize: fontSizes.lg,
  fontFamily: 'inherit',
  background: t.surface,
  color: t.text,
});

export const button = style({
  minHeight: 44,
  padding: '0 18px',
  border: `2.5px solid ${t.onAccent}`,
  borderRadius: radii[2],
  background: t.accent,
  color: t.onAccent,
  boxShadow: shade.small,
  fontSize: fontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontFamily: 'inherit',
  cursor: 'pointer',
  alignSelf: 'flex-start',
  selectors: {
    '&:active:not(:disabled)': { transform: pressTransform.to, boxShadow: shade.pressed },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const buttonQuiet = style([
  button,
  { background: t.raised, color: t.text, border: line.thick, boxShadow: `3px 3px 0 ${t.line}` },
]);

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
