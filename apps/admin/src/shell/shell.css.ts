import { style } from '@vanilla-extract/css';
import { borders, colors, fontSizes, radii, shadows, typography } from '@xangarro/tokens';

export const frame = style({ display: 'flex', minHeight: '100vh' });

export const aside = style({
  flex: 'none',
  width: 232,
  display: 'flex',
  flexDirection: 'column',
  background: colors.white,
  borderRight: borders.thick,
});

export const brand = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '18px 16px',
  borderBottom: borders.thick,
});

export const wordmark = style({
  fontSize: fontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const badge = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.redText,
  textTransform: 'uppercase',
  letterSpacing: typography.letterSpacing.widest,
});

export const nav = style({ display: 'flex', flexDirection: 'column', gap: 5, padding: 12 });

export const navItem = style({
  display: 'flex',
  alignItems: 'center',
  minHeight: 44,
  padding: '0 12px',
  borderRadius: radii[2],
  border: '2px solid transparent',
  color: colors.black,
  textDecoration: 'none',
  fontSize: fontSizes.md,
  fontWeight: typography.weights.bold,
  selectors: {
    '&[aria-current="page"]': {
      background: colors.yellow,
      borderColor: colors.black,
      boxShadow: shadows.small,
    },
  },
});

export const footer = style({
  marginTop: 'auto',
  padding: 12,
  borderTop: borders.thin,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const who = style({ fontSize: fontSizes.sm, color: colors.gray600, wordBreak: 'break-all' });

export const main = style({ flex: 1, minWidth: 0, padding: 32 });
