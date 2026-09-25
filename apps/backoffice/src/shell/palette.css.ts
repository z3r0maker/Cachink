import { style } from '@vanilla-extract/css';
import { colors, fontSizes, radii, typography } from '@xangarro/tokens';

import { line, monoStack, t } from '@/styles/theme.css';

/** ⌘K: jump anywhere in the console, or search a business. */

export const trigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 30,
  padding: '0 10px',
  border: line.thin,
  borderRadius: radii[1],
  background: t.surface,
  color: t.dim,
  fontFamily: 'inherit',
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  cursor: 'pointer',
  selectors: { '&:hover': { borderColor: t.accent, color: t.text } },
});

export const kbd = style({
  fontFamily: monoStack,
  fontSize: fontSizes.xs,
  padding: '1px 6px',
  border: line.thin,
  borderRadius: radii[0],
  color: t.body,
});

export const dialog = style({
  width: 'min(640px, calc(100vw - 32px))',
  marginTop: '14vh',
  padding: 0,
  border: `2.5px solid ${t.accent}`,
  borderRadius: radii[4],
  background: t.surface,
  color: t.body,
  boxShadow: `6px 6px 0 ${t.accent}`,
  selectors: { '&::backdrop': { background: colors.scrim } },
});

export const searchRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 16px',
  borderBottom: line.thin,
  color: t.accent,
});

export const search = style({
  flex: 1,
  height: 32,
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: t.text,
  fontFamily: 'inherit',
  fontSize: fontSizes.xl,
  fontWeight: typography.weights.bold,
  selectors: { '&::placeholder': { color: t.dim } },
});

export const group = style({ padding: '8px 8px 4px' });

export const groupTitle = style({
  display: 'block',
  padding: '6px 10px',
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: t.dim,
});

export const option = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  minHeight: 42,
  padding: '0 10px',
  border: 0,
  borderRadius: radii[1],
  background: 'transparent',
  color: t.body,
  fontFamily: 'inherit',
  fontSize: fontSizes.md,
  fontWeight: typography.weights.bold,
  textAlign: 'left',
  cursor: 'pointer',
  selectors: {
    '&[aria-selected="true"]': { background: t.raised, boxShadow: `inset 3px 0 0 ${t.accent}` },
  },
});

export const optionLabel = style({ flex: 1 });

export const hint = style({ fontFamily: monoStack, fontSize: fontSizes.xs, color: t.dim });

export const footer = style({
  display: 'flex',
  gap: 18,
  padding: '10px 16px',
  borderTop: line.thin,
  fontFamily: monoStack,
  fontSize: fontSizes.xs,
  color: t.dim,
});
