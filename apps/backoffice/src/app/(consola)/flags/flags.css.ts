import { style, styleVariants } from '@vanilla-extract/css';
import { fontSizes, radii, typography } from '@xangarro/tokens';

import { line, t } from '@/styles/theme.css';

import { card } from '@/styles/ui.css';

/** The editor: an open, non-modal `<dialog>` rendered by the server from `?editar=`. */
export const editor = style([card, { position: 'static', margin: 0, maxWidth: 640 }]);

/** The history drawer, pinned to the right edge. */
export const drawer = style({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: 'min(440px, 100vw)',
  overflowY: 'auto',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  background: t.surface,
  borderLeft: line.thick,
  boxShadow: `4px 4px 0 ${t.line}`,
  zIndex: 10,
});

export const events = style({ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 });

export const eventItem = style({
  padding: 12,
  border: line.thin,
  borderRadius: radii[2],
  fontSize: fontSizes.sm,
  color: t.body,
});

export const actions = style({ display: 'flex', gap: 12, flexWrap: 'wrap' });

const pill = {
  display: 'inline-block',
  padding: '1px 8px',
  borderRadius: radii[2],
  border: line.thin,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  color: t.text,
};

export const mode = styleVariants({
  on: [pill, { background: t.okSoft }],
  off: [pill, { background: t.badSoft }],
  allowlist: [pill, { background: t.infoSoft }],
});

export const choices = style({ display: 'grid', gap: 8, border: 'none', margin: 0, padding: 0 });

export const choice = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  minHeight: 44,
  padding: '8px 12px',
  border: line.thin,
  borderRadius: radii[2],
  fontSize: fontSizes.sm,
  cursor: 'pointer',
});

export const choiceTitle = style({ display: 'block', fontWeight: typography.weights.extraBold });

/** The kill-switch cover: yellow-and-black hazard stripes, the one pattern in the console. */
export const hazard = style({
  display: 'inline-flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  width: 104,
  height: 44,
  paddingBottom: 6,
  border: `2.5px solid ${t.onAccent}`,
  borderRadius: radii[1],
  background: `repeating-linear-gradient(-45deg, ${t.accent} 0 10px, ${t.onAccent} 10px 20px)`,
  cursor: 'pointer',
  selectors: { '&:focus-visible': { outlineOffset: 3 } },
});

export const lid = style({
  padding: '2px 6px',
  border: 0,
  borderRadius: radii[0],
  background: t.onAccent,
  color: t.accent,
  fontFamily: 'inherit',
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.wide,
  cursor: 'pointer',
});

export const lidOpen = style({ display: 'inline-flex', alignItems: 'center', gap: 10 });

export const groupTitle = style({
  margin: '8px 0 0',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: t.text,
});
