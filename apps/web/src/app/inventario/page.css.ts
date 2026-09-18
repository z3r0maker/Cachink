import { style } from '@vanilla-extract/css';
import { colors, fontSizes, typography } from '@xangarro/tokens';

export const page = style({
  maxWidth: 1760,
  margin: '0 auto',
  padding: '28px 32px 96px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});

export const h1 = style({
  margin: 0,
  fontSize: fontSizes.xl6,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const subtitle = style({
  margin: '6px 0 0',
  fontSize: fontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const eyebrow = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const row = style({ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' });

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16,
});

export const section = style({ display: 'flex', flexDirection: 'column', gap: 12 });
