import { style } from '@vanilla-extract/css';
import { fontSizes, radii, typography } from '@xangarro/tokens';

import { line, t } from '@/styles/theme.css';

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
  border: line.thin,
  borderRadius: radii[2],
  background: t.warnSoft,
  borderColor: t.warn,
  fontSize: fontSizes.sm,
  color: t.body,
});

export const tableWrap = style({ overflowX: 'auto' });

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: fontSizes.sm,
  color: t.body,
});

export const th = style({
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: line.thin,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: t.dim,
  whiteSpace: 'nowrap',
});

export const td = style({
  padding: '12px',
  borderTop: `2px solid ${t.lineSoft}`,
  verticalAlign: 'top',
  fontVariantNumeric: 'tabular-nums',
  selectors: { 'tr:hover > &': { background: t.raised } },
});

export const name = style({
  color: t.text,
  fontWeight: typography.weights.extraBold,
  textDecoration: 'none',
  selectors: { '&:hover': { textDecoration: 'underline' } },
});

export const sub = style({ display: 'block', color: t.dim, fontSize: fontSizes.xs });

export const tag = style({
  marginLeft: 6,
  padding: '1px 6px',
  borderRadius: radii[2],
  border: line.thin,
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
  color: t.text,
});

export const healthCell = style({ width: 44, textAlign: 'center', verticalAlign: 'middle' });

export const stale = style({ color: t.bad, fontWeight: typography.weights.bold });
