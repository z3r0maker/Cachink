import { keyframes, style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

/**
 * `Operador Estado` (OpEstados): every operator screen's three non-happy
 * states. A quiet card with Don Cuentas: counting while it loads, helping
 * when there is nothing yet, worried when it failed.
 */
const calm = { '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } } };

const card = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  padding: '22px 26px 26px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
  textAlign: 'center',
});

export const emptyCard = style([card, { justifyContent: 'center', minHeight: 380 }]);
export const errorCard = style([
  card,
  { justifyContent: 'center', minHeight: 380, borderColor: colors.redText },
]);
export const loadingCard = style([card, { gap: 6, padding: 22, overflow: 'hidden' }]);

export const title = style({
  margin: 0,
  fontSize: portalFontSizes.xl2,
  lineHeight: 1.2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.025em',
  color: colors.black,
  textWrap: 'pretty',
});

export const body = style({
  maxWidth: 440,
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const safe = style({ fontWeight: typography.weights.extraBold, color: colors.greenText });

export const action = style([
  pressable,
  {
    marginTop: 10,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    height: 54,
    padding: '0 24px',
    border: borders.thick,
    borderRadius: radii[3],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.lgx,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    textDecoration: 'none',
    selectors: { '&:disabled': { opacity: 1, cursor: 'progress' } },
  },
]);

/* Loading: Don counting, a coin in the air, the rotating line, three rows. */
const volado = keyframes({
  '0%': { transform: 'translateY(0) rotateY(0deg)' },
  '50%': { transform: 'translateY(-64px) rotateY(540deg)' },
  '100%': { transform: 'translateY(0) rotateY(1080deg)' },
});
const respira = keyframes({ '0%, 100%': { opacity: 0.55 }, '50%': { opacity: 1 } });
const gira = keyframes({
  '0%': { transform: 'rotateY(0deg)' },
  '100%': { transform: 'rotateY(360deg)' },
});

export const scene = style({ position: 'relative', width: 180, height: 170, flex: 'none' });
export const don = style({ position: 'absolute', left: 0, bottom: 0 });

export const coin = style([
  {
    position: 'absolute',
    left: 24,
    top: 30,
    zIndex: 1,
    width: 30,
    height: 30,
    display: 'grid',
    placeItems: 'center',
    border: borders.thin,
    borderRadius: shapeRadii.pill,
    background: colors.yellow,
    fontFamily: 'var(--font-anton), sans-serif',
    fontSize: fontSizes.xs,
    color: colors.black,
    animation: `${volado} 1.2s cubic-bezier(.3,0,.5,1) infinite`,
  },
  calm,
]);

export const frase = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const sub = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const rows = style([
  {
    alignSelf: 'stretch',
    marginTop: 'auto',
    paddingTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    animation: `${respira} 1.6s ease-in-out infinite`,
  },
  calm,
]);

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  height: 44,
  padding: '0 12px',
  border: borders.quiet,
  borderColor: colors.gray100,
  borderRadius: radii[3],
});

export const rowTile = style({
  width: 28,
  height: 28,
  flex: 'none',
  borderRadius: radii[0],
  background: colors.gray200,
});

const bar = { height: 10, borderRadius: radii[0] } as const;
export const rowBar = style({ ...bar, background: colors.gray200 });
export const rowBarShort = style({
  ...bar,
  marginLeft: 'auto',
  width: 54,
  background: colors.gray100,
});

/** The coin that spins inside the retry while it works («Intentando…»). */
export const spin = style([
  {
    width: 18,
    height: 18,
    flex: 'none',
    border: borders.thick,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    animation: `${gira} .9s linear infinite`,
  },
  calm,
]);
