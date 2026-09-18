import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * The onboarding pages: one centred column on the yellow-soft ground, no
 * shell (a new owner has no business to navigate yet). The progress bar is
 * P-04's: 14 px, 2 px border, radius 8.
 */
export const page = style({
  minHeight: '100vh',
  background: colors.offwhite,
  padding: '6vh 16px 64px',
});

export const column = style({
  maxWidth: 560,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const title = style({
  margin: 0,
  fontSize: portalFontSizes.xl5,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
  textWrap: 'balance',
});

export const subtitle = style({
  margin: '6px 0 0',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const stack = style({ display: 'flex', flexDirection: 'column', gap: 14 });

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
  marginTop: 8,
});

export const push = style({ marginLeft: 'auto' });

export const track = style({
  height: 14,
  background: colors.white,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[0],
  overflow: 'hidden',
});

export const fill = style({ display: 'block', height: '100%', background: colors.yellow });

export const note = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

export const row = style({ display: 'flex', alignItems: 'flex-start', gap: 12 });

export const rowTitle = style({
  display: 'block',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const link = style({ color: colors.black, fontWeight: typography.weights.bold });

export const price = style({
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});
