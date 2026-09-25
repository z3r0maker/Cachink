import { style, styleVariants } from '@vanilla-extract/css';
import { fontSizes, radii, typography } from '@xangarro/tokens';

import { line, t } from '@/styles/theme.css';

import { card } from '@/styles/ui.css';

export const capacityCard = style([card, { maxWidth: 1120 }]);

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
});

const tileBase = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 12,
  border: line.thin,
  borderRadius: radii[2],
  color: t.text,
});

/** Amber at 80 % of a trigger, red at the trigger (N-07 acceptance). */
export const tile = styleVariants({
  ok: [tileBase, { background: t.surface }],
  amber: [tileBase, { background: t.warnSoft, borderColor: t.warn }],
  red: [tileBase, { background: t.badSoft, borderColor: t.bad }],
  'sin-datos': [tileBase, { background: t.raised }],
});

export const tileLabel = style({ fontSize: fontSizes.sm, fontWeight: typography.weights.bold });

export const tileValue = style({
  fontSize: fontSizes.xl,
  fontWeight: typography.weights.extraBold,
});

export const tileMeta = style({ fontSize: fontSizes.xs, color: t.dim });
