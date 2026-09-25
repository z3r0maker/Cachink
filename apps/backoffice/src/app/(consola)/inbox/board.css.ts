import { style } from '@vanilla-extract/css';
import { fontSizes, typography } from '@xangarro/tokens';

import { line, monoStack, t } from '@/styles/theme.css';
import { card } from '@/styles/ui.css';

/** Inbox as a board: Nuevo · En curso · Resuelto. */

export const page = style([card]);

export const board = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 14,
  alignItems: 'start',
  '@media': { 'screen and (max-width: 1099px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const column = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 320,
  border: line.thin,
  borderRadius: 14,
  background: t.raised,
});

export const columnHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 16px',
  borderBottom: line.thin,
});

export const columnTitle = style({
  margin: 0,
  fontSize: fontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: t.text,
});

export const count = style({
  marginLeft: 'auto',
  fontFamily: monoStack,
  fontSize: fontSizes.xs,
  color: t.dim,
});

export const cards = style({
  listStyle: 'none',
  margin: 0,
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const cardItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '10px 12px',
  border: line.thin,
  borderRadius: 10,
  background: t.surface,
  selectors: { '&:hover': { borderColor: t.accent } },
});

export const time = style({ fontFamily: monoStack, fontSize: fontSizes.xs, color: t.dim });

export const empty = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: 24,
  textAlign: 'center',
});

export const emptyTitle = style({
  margin: 0,
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: t.text,
});

export const emptyText = style({
  margin: 0,
  maxWidth: 260,
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: t.dim,
});

export const more = style({
  padding: '0 12px 12px',
  color: t.accent,
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.extraBold,
  textDecoration: 'none',
  selectors: { '&:hover': { textDecoration: 'underline' } },
});
