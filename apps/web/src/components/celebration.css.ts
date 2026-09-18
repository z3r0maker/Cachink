import { keyframes, style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

const pop = keyframes({
  from: { opacity: 0, transform: 'translate(-50%, -50%) scale(0.96)' },
  to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
});

const fall = keyframes({
  to: { transform: 'translateY(240px) rotate(220deg)', opacity: 0 },
});

export const takeover = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'min(460px, calc(100vw - 32px))',
  background: colors.yellow,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  boxShadow: shadows.hero,
  padding: 36,
  textAlign: 'center',
  overflow: 'hidden',
  animation: `${pop} 160ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const confettiPiece = style({
  position: 'absolute',
  top: -12,
  width: 10,
  height: 14,
  border: `2px solid ${colors.black}`,
  animationName: fall,
  animationDuration: '1400ms',
  animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  animationFillMode: 'forwards',
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none', display: 'none' } },
});

export const takeoverTitle = style({
  margin: '18px 0 0',
  fontSize: portalFontSizes.xl5,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const takeoverBody = style({
  margin: '10px 0 0',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.semibold,
  color: colors.black,
});

export const streakRow = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 16,
});
