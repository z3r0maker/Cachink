import { style, styleVariants } from '@vanilla-extract/css';
import { colors, fontSizes, typography } from '@xangarro/tokens';

/**
 * KPI card — uppercase eyebrow, a 34 px tabular figure, then a muted hint.
 *
 * Cards sit in `repeat(auto-fit, minmax(260px, 1fr))` so four fill a wide
 * screen and reflow gracefully (design handoff, "KPI card").
 */
export const kpiGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16,
});

export const kpiEyebrow = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const kpiFigure = style({
  margin: '10px 0 0',
  fontSize: fontSizes.xl5,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tightest,
  fontVariantNumeric: 'tabular-nums',
});

/** Ingresos read green, egresos red; everything else stays ink-black. */
export const kpiFigureTone = styleVariants({
  neutral: { color: colors.black },
  positive: { color: colors.greenText },
  negative: { color: colors.redText },
  warning: { color: colors.warningText },
});

export const kpiHint = style({
  margin: '8px 0 0',
  fontSize: fontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const deltaLine = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 10,
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
});

export const deltaTone = styleVariants({
  up: { color: colors.greenText },
  down: { color: colors.redText },
  flat: { color: colors.textMuted },
});

/** A short coloured sentence under a key number, always with a dot. */
export const verdict = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 10,
  fontSize: fontSizes.md,
  fontWeight: typography.weights.bold,
});

export const verdictTone = styleVariants({
  healthy: { color: colors.greenText },
  warning: { color: colors.warningText },
  critical: { color: colors.redText },
});
