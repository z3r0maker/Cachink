import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, fontSizes, radii, typography } from '@xangarro/tokens';

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
  border: borders.thin,
  borderRadius: radii[2],
  color: colors.black,
});

/** Amber at 80 % of a trigger, red at the trigger (N-07 acceptance). */
export const tile = styleVariants({
  ok: [tileBase, { background: colors.white }],
  amber: [tileBase, { background: colors.warningSoft, borderColor: colors.warning }],
  red: [tileBase, { background: colors.redSoft, borderColor: colors.red }],
  'sin-datos': [tileBase, { background: colors.gray100 }],
});

export const tileLabel = style({ fontSize: fontSizes.sm, fontWeight: typography.weights.bold });

export const tileValue = style({
  fontSize: fontSizes.xl,
  fontWeight: typography.weights.extraBold,
});

export const tileMeta = style({ fontSize: fontSizes.xs, color: colors.gray600 });
