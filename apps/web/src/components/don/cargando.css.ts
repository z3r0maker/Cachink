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

const calm = { '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } } };

const barra = keyframes({
  '0%': { transform: 'translateX(-100%) scaleX(0.3)' },
  '60%': { transform: 'translateX(40%) scaleX(0.6)' },
  '100%': { transform: 'translateX(110%) scaleX(0.3)' },
});
const volado = keyframes({
  '0%': { transform: 'translateY(0) rotateY(0deg)' },
  '50%': { transform: 'translateY(-84px) rotateY(540deg)' },
  '100%': { transform: 'translateY(0) rotateY(1080deg)' },
});
const respira = keyframes({ '0%, 100%': { opacity: 0.45 }, '50%': { opacity: 0.8 } });
const gira = keyframes({
  '0%': { transform: 'rotateY(0deg)' },
  '100%': { transform: 'rotateY(360deg)' },
});

/** The route-change bar: a black stripe running along the top of the page. */
export const track = style({
  position: 'relative',
  height: 4,
  overflow: 'hidden',
  background: colors.yellowSoft,
});
export const bar = style([
  {
    display: 'block',
    height: '100%',
    background: colors.black,
    transformOrigin: '0 50%',
    animation: `${barra} 1.8s cubic-bezier(.4,0,.2,1) infinite`,
  },
  calm,
]);

export const stage = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  paddingTop: 36,
});
export const scene = style({ position: 'relative', width: 240, height: 250 });

export const coin = style([
  {
    position: 'absolute',
    left: 30,
    top: 18,
    width: 34,
    height: 34,
    boxSizing: 'border-box',
    display: 'grid',
    placeItems: 'center',
    borderRadius: shapeRadii.pill,
    border: borders.thin,
    background: colors.yellow,
    fontFamily: 'var(--font-anton), sans-serif',
    fontSize: fontSizes.md,
    animation: `${volado} 1.2s cubic-bezier(.3,0,.5,1) infinite`,
  },
  calm,
]);

export const don = style({ position: 'absolute', left: 0, bottom: 0 });

export const frase = style({
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.02em',
  color: colors.black,
});

export const sub = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const ghosts = style([
  {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
    gap: 22,
    marginTop: 22,
    animation: `${respira} 1.6s ease-in-out infinite`,
    opacity: 0.45,
  },
  calm,
]);

export const ghost = style({
  height: 150,
  borderRadius: radii[6],
  border: borders.quiet,
  background: colors.white,
});

/** The small coin that spins inside a busy button. */
export const miniCoin = style([
  {
    display: 'inline-block',
    width: 18,
    height: 18,
    boxSizing: 'border-box',
    borderRadius: shapeRadii.pill,
    border: borders.thin,
    background: colors.yellow,
    animation: `${gira} .9s linear infinite`,
  },
  calm,
]);
