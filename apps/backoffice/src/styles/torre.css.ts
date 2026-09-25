import { style, styleVariants } from '@vanilla-extract/css';
import { fontSizes, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { line, monoStack, t } from './theme.css';

/** The console's page-level parts: headers, panels, figures, severity tags. */

export const page = style({ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1360 });

export const pageHead = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 16,
  flexWrap: 'wrap',
});

export const eyebrow = style({
  display: 'block',
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: t.dim,
});

export const title = style({
  margin: '4px 0 0',
  fontSize: portalFontSizes.xl5,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: t.text,
});

export const panel = style({
  border: line.thin,
  borderRadius: radii[3],
  background: t.surface,
  minWidth: 0,
});

export const panelHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 18px',
  borderBottom: line.thin,
});

export const panelTitle = style({
  margin: 0,
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: t.text,
});

export const mono = style({ fontFamily: monoStack, fontVariantNumeric: 'tabular-nums' });

export const faint = style([mono, { fontSize: fontSizes.xs, color: t.dim }]);

export const grid = style({ display: 'grid', gap: 14 });

export const kpi = style([
  panel,
  { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
]);

export const kpiValue = style([
  mono,
  {
    fontSize: portalFontSizes.pageTitle,
    lineHeight: 1,
    fontWeight: typography.weights.bold,
    color: t.text,
  },
]);

export const kpiSub = style({
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: t.dim,
});

export const row = style({
  display: 'grid',
  gap: 14,
  alignItems: 'center',
  padding: '14px 18px',
  borderTop: `2px solid ${t.lineSoft}`,
  selectors: { '&:first-of-type': { borderTop: 0 } },
});

export const rowTitle = style({
  display: 'block',
  fontSize: fontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: t.text,
});

export const rowDetail = style({
  display: 'block',
  marginTop: 3,
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: t.dim,
});

const sevBase = style({
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: radii[0],
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  textAlign: 'center',
});

export const sev = styleVariants({
  alta: [sevBase, { background: t.bad, color: t.onAccent }],
  media: [sevBase, { background: t.warn, color: t.onAccent }],
  baja: [sevBase, { background: t.raised, color: t.body }],
  sistema: [sevBase, { border: line.thin, color: t.dim }],
});

export const linkButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 36,
  padding: '0 14px',
  border: line.thin,
  borderRadius: radii[1],
  background: t.raised,
  color: t.text,
  textDecoration: 'none',
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
  selectors: { '&:hover': { borderColor: t.accent } },
});

export const linkPrimary = style([
  linkButton,
  { background: t.accent, borderColor: t.accent, color: t.onAccent },
]);

export const bar = style({
  height: 8,
  borderRadius: 9999,
  background: t.raised,
  overflow: 'hidden',
});

export const list = style({ listStyle: 'none', margin: 0, padding: 0 });
