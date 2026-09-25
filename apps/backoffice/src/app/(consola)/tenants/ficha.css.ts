import { style } from '@vanilla-extract/css';
import { fontSizes, radii, typography } from '@xangarro/tokens';

import { line, t } from '@/styles/theme.css';

/** «Ficha 360°»: one business at a glance, over the list. */

export const scrim = style({
  position: 'fixed',
  inset: 0,
  zIndex: 20,
  background: t.scrim,
});

export const panel = style({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 21,
  width: 'min(520px, 100vw)',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  background: t.surface,
  borderLeft: `2.5px solid ${t.accent}`,
  color: t.body,
});

export const head = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '20px 22px 16px',
  borderBottom: line.thin,
});

export const headRow = style({ display: 'flex', alignItems: 'center', gap: 10 });

export const close = style({
  marginLeft: 'auto',
  display: 'grid',
  placeItems: 'center',
  width: 36,
  height: 36,
  border: line.thin,
  borderRadius: radii[1],
  background: t.raised,
  color: t.text,
  textDecoration: 'none',
  fontWeight: typography.weights.extraBold,
});

export const name = style({
  margin: 0,
  fontSize: fontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: t.text,
});

export const chips = style({ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' });

export const chip = style({
  padding: '3px 8px',
  borderRadius: radii[0],
  background: t.accent,
  color: t.onAccent,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
});

export const chipQuiet = style([chip, { background: t.raised, color: t.body }]);

export const section = style({ padding: '16px 22px', borderBottom: line.thin });

export const stats = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
});

export const stat = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 12,
  border: line.thin,
  borderRadius: radii[2],
});

export const statValue = style({
  fontSize: fontSizes.xl2,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: t.text,
});

export const devices = style({
  listStyle: 'none',
  margin: '8px 0 0',
  padding: 0,
  display: 'grid',
  gap: 8,
});

export const device = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  border: line.thin,
  borderRadius: radii[1],
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
});

export const deviceName = style({ flex: 1, color: t.text });

export const actions = style({
  marginTop: 'auto',
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  padding: '16px 22px',
  borderTop: line.thin,
});
