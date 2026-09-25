import { style } from '@vanilla-extract/css';
import { fontSizes, radii, typography } from '@xangarro/tokens';

import { line, shade, t } from '@/styles/theme.css';

import { card } from '@/styles/ui.css';

export const wide = style([card, { maxWidth: 960 }]);

export const chipRow = style({ display: 'flex', flexWrap: 'wrap', gap: 8 });

export const chipGroup = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 36,
  padding: '0 12px',
  borderRadius: radii[2],
  border: line.thin,
  background: t.surface,
  color: t.text,
  textDecoration: 'none',
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
  selectors: {
    '&[aria-current="true"]': {
      background: t.accent,
      color: t.onAccent,
      border: line.thick,
      boxShadow: shade.small,
    },
  },
});

export const list = style({ listStyle: 'none', margin: 0, padding: 0 });

export const row = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 4,
  padding: '12px 0',
  borderTop: line.thin,
});

export const rowTitle = style({
  color: t.text,
  fontSize: fontSizes.md,
  fontWeight: typography.weights.extraBold,
  textDecoration: 'none',
  selectors: { '&:hover': { textDecoration: 'underline' } },
});

export const meta = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center',
  fontSize: fontSizes.sm,
  color: t.dim,
});

export const urgentBadge = style({
  padding: '2px 8px',
  borderRadius: radii[2],
  background: t.bad,
  color: t.onAccent,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  textTransform: 'uppercase',
  letterSpacing: typography.letterSpacing.widest,
});

export const pill = style({
  padding: '2px 8px',
  borderRadius: radii[2],
  border: line.thin,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  color: t.text,
});

export const bodyText = style({
  margin: 0,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  fontSize: fontSizes.md,
  color: t.body,
});

export const facts = style({
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  gap: '6px 16px',
  margin: 0,
  fontSize: fontSizes.sm,
});

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 24,
  alignItems: 'flex-start',
});

export const select = style({
  minHeight: 44,
  padding: '0 12px',
  border: line.thin,
  borderRadius: radii[2],
  fontSize: fontSizes.md,
  fontFamily: 'inherit',
  background: t.surface,
  color: t.text,
});
