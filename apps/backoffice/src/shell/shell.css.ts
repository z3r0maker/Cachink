import { style } from '@vanilla-extract/css';
import { fontSizes, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

import { line, monoStack, t } from '@/styles/theme.css';

/**
 * «Torre de Control» — the console's frame: a dark rail on the left, the
 * status bar across the top, and the work area. The frame carries `torreDark`,
 * so everything inside it reads the dark roles.
 */

export const frame = style({
  display: 'grid',
  gridTemplateColumns: '232px minmax(0, 1fr)',
  minHeight: '100vh',
  background: t.bg,
  color: t.body,
});

export const aside = style({
  position: 'sticky',
  top: 0,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
  padding: '20px 14px',
  borderRight: line.thin,
  background: t.bg,
});

export const brand = style({ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 6px' });

export const wordmark = style({
  fontFamily: 'var(--font-anton), Impact, sans-serif',
  fontSize: portalFontSizes.xl5,
  lineHeight: 0.95,
  color: t.accent,
});

export const badge = style({
  fontFamily: monoStack,
  fontSize: fontSizes.xs,
  letterSpacing: typography.letterSpacing.widest,
  color: t.dim,
});

export const nav = style({ display: 'flex', flexDirection: 'column', gap: 2 });

export const navItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 40,
  padding: '0 12px',
  borderRadius: radii[1],
  color: t.dim,
  textDecoration: 'none',
  fontSize: fontSizes.md,
  fontWeight: typography.weights.bold,
  selectors: {
    '&:hover': { background: t.raised, color: t.text },
    '&[aria-current="page"]': { background: t.accent, color: t.onAccent },
  },
});

export const navLabel = style({ flex: 1 });

export const navCount = style({
  fontFamily: monoStack,
  fontSize: fontSizes.xs,
  padding: '1px 7px',
  borderRadius: radii[0],
  background: t.raised,
  color: t.dim,
  selectors: {
    [`${navItem}[aria-current="page"] &`]: { background: t.onAccent, color: t.accent },
  },
});

export const navCountHot = style({ background: t.bad, color: t.onAccent });

export const footer = style({
  marginTop: 'auto',
  padding: 12,
  border: line.thin,
  borderRadius: radii[2],
  background: t.surface,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const who = style({
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
  color: t.text,
  wordBreak: 'break-all',
});

export const column = style({ display: 'flex', flexDirection: 'column', minWidth: 0 });

export const status = style({
  position: 'sticky',
  top: 0,
  zIndex: 5,
  display: 'flex',
  alignItems: 'center',
  gap: 22,
  minHeight: 44,
  padding: '0 24px',
  borderBottom: line.thin,
  background: t.bg,
  fontFamily: monoStack,
  fontSize: fontSizes.xs,
  color: t.dim,
  overflowX: 'auto',
  whiteSpace: 'nowrap',
});

export const env = style({
  padding: '3px 8px',
  borderRadius: radii[0],
  background: t.accent,
  color: t.onAccent,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.wide,
});

export const envQuiet = style({ background: t.raised, color: t.text });

export const reading = style({ display: 'inline-flex', alignItems: 'center', gap: 8 });

export const clock = style({ marginLeft: 'auto', color: t.body });

export const main = style({ flex: 1, minWidth: 0, padding: '22px 24px 32px' });

const ledBase = {
  display: 'inline-block',
  flex: 'none',
  width: 8,
  height: 8,
  borderRadius: shapeRadii.pill,
} as const;

/** Status lights: the console's whole colour vocabulary for state. */
export const led = {
  ok: style({ ...ledBase, background: t.ok, boxShadow: `0 0 0 3px ${t.okSoft}` }),
  warn: style({ ...ledBase, background: t.warn, boxShadow: `0 0 0 3px ${t.warnSoft}` }),
  bad: style({ ...ledBase, background: t.bad, boxShadow: `0 0 0 3px ${t.badSoft}` }),
  off: style({ ...ledBase, background: t.off }),
} as const;

export type Led = keyof typeof led;
