import { style } from '@vanilla-extract/css';
import { borders, colors, fontSizes, radii, typography } from '@xangarro/tokens';

import { card } from '@/styles/ui.css';

export const wide = style([card, { maxWidth: 1120 }]);

export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'flex-end',
});

export const check = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 44,
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
});

export const notice = style({
  margin: 0,
  padding: '10px 12px',
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.yellow,
  fontSize: fontSizes.sm,
  color: colors.black,
});

export const tableWrap = style({ overflowX: 'auto' });

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: fontSizes.sm,
  color: colors.ink,
});

export const th = style({
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: borders.thick,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  whiteSpace: 'nowrap',
});

export const td = style({ padding: '10px', borderTop: borders.thin, verticalAlign: 'top' });

export const name = style({
  color: colors.black,
  fontWeight: typography.weights.extraBold,
  textDecoration: 'none',
  selectors: { '&:hover': { textDecoration: 'underline' } },
});

export const sub = style({ display: 'block', color: colors.textMuted, fontSize: fontSizes.xs });

export const tag = style({
  marginLeft: 6,
  padding: '1px 6px',
  borderRadius: radii[2],
  border: borders.thin,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
});

export const sections = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 20,
});

export const sectionTitle = style({
  margin: 0,
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});
