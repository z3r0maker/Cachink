import { keyframes, style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/**
 * «La trastienda» — the console's sign-in pages (login and both MFA steps).
 *
 * Don Cuentas guards the door on the left; the form is a «vale de entrada» on
 * the right. His mood is a `data-mood` attribute on the page root, and every
 * reaction below is a selector on it: the CSP has no `'unsafe-inline'`, so no
 * state may travel through a `style=""` attribute.
 */

const COVERING = ['password', 'peek'] as const;
const mood = (m: string) => `[data-mood="${m}"] &`;
const WIDE = 'screen and (min-width: 960px)';
const MOTION_OK = '(prefers-reduced-motion: no-preference)';

export const page = style({
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  '@media': {
    [WIDE]: { gridTemplateColumns: 'minmax(460px, 44%) minmax(0, 1fr)' },
  },
});

/* ─── The door: Don Cuentas on black ─── */

export const door = style({
  background: colors.black,
  color: colors.white,
  padding: '24px 20px 32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 20,
  '@media': {
    [WIDE]: {
      padding: '44px 56px',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      gap: 32,
    },
  },
});

export const brandRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  alignSelf: 'stretch',
});

export const wordmark = style({
  fontSize: fontSizes.xl4,
  fontWeight: typography.weights.black,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.yellow,
  lineHeight: 1,
});

export const badge = style({
  border: `2px solid ${colors.white}`,
  borderRadius: shapeRadii.pill,
  padding: '4px 10px',
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
});

export const stage = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 18,
});

const pop = keyframes({
  from: { transform: 'scale(0.92) rotate(-2deg)', opacity: 0.4 },
  to: { transform: 'none', opacity: 1 },
});

export const bubble = style({
  position: 'relative',
  maxWidth: 420,
  margin: 0,
  background: colors.white,
  color: colors.black,
  border: borders.thick,
  borderRadius: radii[5],
  boxShadow: `5px 5px 0 ${colors.yellow}`,
  padding: '14px 18px',
  fontSize: fontSizes.lg,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  textAlign: 'center',
  '@media': {
    [WIDE]: { fontSize: fontSizes.xl, padding: '16px 20px' },
    [MOTION_OK]: { animation: `${pop} 0.35s cubic-bezier(.3,1.5,.5,1)` },
  },
  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      left: '50%',
      bottom: -13,
      width: 22,
      height: 22,
      background: colors.white,
      borderRight: borders.thick,
      borderBottom: borders.thick,
      transform: 'translateX(-50%) rotate(45deg)',
    },
  },
});

export const portrait = style({
  position: 'relative',
  flex: 'none',
  width: 200,
  height: 200,
  borderRadius: shapeRadii.pill,
  background: colors.yellowSoft,
  border: `2.5px solid ${colors.white}`,
  boxShadow: `5px 5px 0 ${colors.yellow}`,
  '@media': {
    [WIDE]: { width: 'min(390px, 30vw)', height: 'min(390px, 30vw)' },
  },
});

const figure = style({
  position: 'absolute',
  inset: '6.5%',
  width: '87%',
  height: '87%',
  objectFit: 'contain',
  transformOrigin: '50% 90%',
  '@media': {
    [MOTION_OK]: {
      transition: 'opacity .2s, transform .35s cubic-bezier(.3,1.4,.5,1)',
    },
  },
});

export const doorman = style([
  figure,
  {
    selectors: {
      ...Object.fromEntries(
        COVERING.map((m) => [mood(m), { opacity: 0, transform: 'scale(.85)' }]),
      ),
      [mood('email')]: { transform: 'rotate(4deg) translateX(2%)' },
      [mood('error')]: { transform: 'rotate(-6deg)' },
    },
  },
]);

export const noPeeking = style([
  figure,
  {
    opacity: 0,
    transform: 'scale(.85)',
    selectors: {
      [mood('password')]: { opacity: 1, transform: 'none' },
      [mood('peek')]: { opacity: 1, transform: 'rotate(-8deg) translateY(-2%)' },
    },
  },
]);

export const tagline = style({
  display: 'none',
  '@media': {
    [WIDE]: { display: 'flex', flexDirection: 'column', gap: 10 },
  },
});

export const taglineTitle = style({
  margin: 0,
  fontSize: portalFontSizes.hero,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
});

export const taglineBody = style({
  margin: 0,
  maxWidth: 470,
  fontSize: fontSizes.xl,
  lineHeight: 1.45,
  color: colors.gray200,
});
