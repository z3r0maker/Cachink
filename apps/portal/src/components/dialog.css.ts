import { keyframes, style } from '@vanilla-extract/css';
import { colors, fontSizes, radii, shadows, typography } from '@xangarro/tokens';

const pop = keyframes({
  from: { opacity: 0, transform: 'translate(-50%, -50%) scale(0.96)' },
  to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
});

/** The modal card is opaque: only the backdrop is translucent. */
export const dialogPanel = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'min(460px, calc(100vw - 32px))',
  maxHeight: 'calc(100vh - 64px)',
  overflowY: 'auto',
  background: colors.white,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  boxShadow: shadows.hero,
  padding: 28,
  animation: `${pop} 120ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const dialogTitle = style({
  margin: 0,
  fontSize: fontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const dialogBody = style({
  margin: '10px 0 0',
  fontSize: fontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  textWrap: 'pretty',
});

export const dialogActions = style({
  display: 'flex',
  gap: 10,
  marginTop: 24,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
});
