import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, fontSizes, radii, shadows, typography } from '@xangarro/tokens';

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
  background: colors.white,
  borderLeft: borders.thick,
  boxShadow: shadows.card,
  zIndex: 10,
});

export const events = style({ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 });

export const eventItem = style({
  padding: 12,
  border: borders.thin,
  borderRadius: radii[2],
  fontSize: fontSizes.sm,
  color: colors.ink,
});

export const actions = style({ display: 'flex', gap: 12, flexWrap: 'wrap' });

const pill = {
  display: 'inline-block',
  padding: '1px 8px',
  borderRadius: radii[2],
  border: borders.thin,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.black,
};

export const mode = styleVariants({
  on: [pill, { background: colors.greenSoft }],
  off: [pill, { background: colors.redSoft }],
  allowlist: [pill, { background: colors.blueSoft }],
});

export const choices = style({ display: 'grid', gap: 8, border: 'none', margin: 0, padding: 0 });

export const choice = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  minHeight: 44,
  padding: '8px 12px',
  border: borders.thin,
  borderRadius: radii[2],
  fontSize: fontSizes.sm,
  cursor: 'pointer',
});

export const choiceTitle = style({ display: 'block', fontWeight: typography.weights.extraBold });
