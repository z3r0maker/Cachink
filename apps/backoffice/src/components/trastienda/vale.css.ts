import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/** The «vale de entrada» — the ticket the sign-in forms sit on. */

const WIDE = 'screen and (min-width: 960px)';

/* ─── The ticket: «vale de entrada» ─── */

export const counter = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 22,
  padding: '48px 16px',
  // The stamp hangs past the ticket's corner; it must never scroll the page.
  overflow: 'hidden',
  backgroundColor: colors.gray200,
  backgroundImage: `radial-gradient(${colors.gray400} 1.2px, transparent 1.2px)`,
  backgroundSize: '18px 18px',
  '@media': { [WIDE]: { padding: 40 } },
});

export const ticketWrap = style({ position: 'relative', width: '100%', maxWidth: 480 });

export const stamp = style({
  position: 'absolute',
  top: -30,
  right: -8,
  zIndex: 1,
  width: 96,
  height: 96,
  borderRadius: shapeRadii.pill,
  background: colors.yellow,
  border: borders.thick,
  boxShadow: shadows.small,
  transform: 'rotate(12deg)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: colors.black,
  '@media': {
    [WIDE]: { width: 118, height: 118, top: -34, right: -38 },
  },
});

export const stampSmall = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
});

export const stampBig = style({
  fontSize: fontSizes.xl2,
  fontWeight: typography.weights.black,
  lineHeight: 1,
});

export const ticket = style({
  background: colors.white,
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.hero,
});

export const stub = style({
  padding: '28px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  '@media': { [WIDE]: { padding: '30px 32px 26px' } },
});

export const eyebrow = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const title = style({
  margin: 0,
  paddingRight: 64,
  fontSize: fontSizes.xl4,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [WIDE]: { fontSize: fontSizes.xl5, paddingRight: 0 } },
});

export const intro = style({
  margin: 0,
  fontSize: fontSizes.md,
  lineHeight: 1.5,
  color: colors.ink,
});

/** The tear line: a row of dots and a notch bitten out of each edge. */
export const perforation = style({
  position: 'relative',
  height: 6,
  margin: '0 22px',
  backgroundImage: `radial-gradient(circle, ${colors.black} 1.6px, transparent 1.9px)`,
  backgroundSize: '11px 6px',
  backgroundRepeat: 'repeat-x',
  selectors: {
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      top: -12,
      width: 30,
      height: 30,
      borderRadius: shapeRadii.pill,
      background: colors.gray200,
      border: borders.thick,
    },
    '&::before': { left: -40, clipPath: 'inset(0 0 0 50%)' },
    '&::after': { right: -40, clipPath: 'inset(0 50% 0 0)' },
  },
});

export const tear = style({
  padding: '24px 24px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  '@media': { [WIDE]: { padding: '26px 32px 30px' } },
});

export const footnote = style({
  margin: 0,
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  textAlign: 'center',
});
