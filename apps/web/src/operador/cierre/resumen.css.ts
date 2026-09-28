import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/** «Resumen del turno» as one quiet strip, the queue's state at its end. */
export const strip = style({
  boxSizing: 'border-box',
  minHeight: 52,
  padding: '8px 20px',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '6px 18px',
  border: borders.quiet,
  borderRadius: radii[4],
  background: colors.white,
  '@media': { [PHONE]: { padding: '10px 14px', gap: '6px 12px' } },
});

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
  '@media': { [PHONE]: { width: '100%' } },
});

export const sep = style({
  width: 2,
  height: 24,
  background: colors.gray200,
  '@media': { [PHONE]: { display: 'none' } },
});

export const item = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  whiteSpace: 'nowrap',
  '@media': { [PHONE]: { fontSize: portalFontSizes.md } },
});

export const cifra = style({
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const hora = style({ fontSize: portalFontSizes.sm, fontVariantNumeric: 'tabular-nums' });

export const sync = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.greenText,
  selectors: { '&[data-pendiente]': { color: colors.warningText } },
  '@media': { [PHONE]: { marginLeft: 0 } },
});
