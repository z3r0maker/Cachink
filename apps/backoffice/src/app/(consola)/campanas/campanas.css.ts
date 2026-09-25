import { style } from '@vanilla-extract/css';
import { fontSizes, shapeRadii, typography } from '@xangarro/tokens';

import { line, monoStack, t } from '@/styles/theme.css';

/** The funnel: three steps, each a bar against the first. */
export const embudo = style({
  listStyle: 'none',
  margin: 0,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  border: line.thin,
  borderRadius: 14,
  background: t.raised,
});

export const paso = style({
  display: 'grid',
  gridTemplateColumns: '180px minmax(0, 1fr) 72px 64px',
  gap: 14,
  alignItems: 'center',
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
  color: t.text,
});

export const bar = style({
  display: 'block',
  width: '100%',
  height: 12,
  border: 0,
  borderRadius: shapeRadii.pill,
  overflow: 'hidden',
  background: t.surface,
  appearance: 'none',
  selectors: {
    '&::-webkit-progress-bar': { background: t.surface },
    '&::-webkit-progress-value': { background: t.accent },
    '&::-moz-progress-bar': { background: t.accent },
  },
});

export const num = style({ fontFamily: monoStack, textAlign: 'right', color: t.text });

export const rate = style({ fontFamily: monoStack, textAlign: 'right', color: t.dim });

export const foot = style({
  margin: 0,
  fontFamily: monoStack,
  fontSize: fontSizes.xs,
  color: t.dim,
});
