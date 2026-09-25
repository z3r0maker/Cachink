import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Don Cuentas's motion (ADR-107). Every animation here stops under
 * `prefers-reduced-motion`; the pose alone still says what he means.
 */
const respira = keyframes({
  '0%, 100%': { transform: 'translateY(0) scale(1)' },
  '50%': { transform: 'translateY(-4px) scale(1.015)' },
});
const saluda = keyframes({
  '0%, 100%': { transform: 'rotate(0deg)' },
  '20%': { transform: 'rotate(-4deg)' },
  '40%': { transform: 'rotate(3deg)' },
  '60%': { transform: 'rotate(-2deg)' },
  '80%': { transform: 'rotate(0deg)' },
});
const salta = keyframes({
  '0%, 100%': { transform: 'translateY(0) scale(1, 1)' },
  '35%': { transform: 'translateY(-24px) scale(0.98, 1.03)' },
  '70%': { transform: 'translateY(0) scale(1.04, 0.96)' },
});
const asiente = keyframes({
  '0%, 100%': { transform: 'rotate(0deg) translateY(0)' },
  '50%': { transform: 'rotate(-2deg) translateY(-3px)' },
});
const duda = keyframes({
  '0%, 100%': { transform: 'rotate(0deg)' },
  '15%': { transform: 'rotate(-3deg)' },
  '30%': { transform: 'rotate(2deg)' },
  '45%': { transform: 'rotate(0deg)' },
});
const parpadea = keyframes({
  '0%': { opacity: 0 },
  '92%': { opacity: 1 },
  '95%': { opacity: 0 },
  '97%': { opacity: 1 },
  '99%': { opacity: 0 },
});

const calm = { '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } } };

export const figure = style({
  position: 'relative',
  display: 'inline-block',
  flex: 'none',
  transformOrigin: '50% 92%',
});

export const motion = styleVariants({
  respira: [{ animation: `${respira} 3.4s ease-in-out infinite` }, calm],
  saluda: [{ animation: `${saluda} 2.2s ease-in-out infinite` }, calm],
  salta: [{ animation: `${salta} 1.1s ease-in-out infinite` }, calm],
  asiente: [{ animation: `${asiente} 1.2s ease-in-out infinite` }, calm],
  duda: [{ animation: `${duda} 2.6s ease-in-out infinite` }, calm],
  ninguno: {},
});

export const image = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

export const blink = style([
  image,
  {
    position: 'absolute',
    inset: 0,
    opacity: 0,
    animation: `${parpadea} 4.6s steps(1, end) infinite`,
  },
  calm,
]);

/** Don beside a speech bubble: his one-line take on the screen. */
export const dice = style({ display: 'flex', alignItems: 'flex-end', gap: 14 });

export const bubble = style({
  position: 'relative',
  flex: 1,
  padding: '14px 16px',
  marginBottom: 18,
  border: borders.thin,
  borderRadius: radii[5],
  fontSize: portalFontSizes.body,
  lineHeight: 1.45,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const bubbleTone = styleVariants({
  amarillo: { background: colors.yellowSoft },
  blanco: { background: colors.white },
  rojo: { background: colors.redSoft },
});

/** The tail is an SVG so its outline meets the bubble's border without a seam. */
export const tail = style({ position: 'absolute', left: -20, bottom: 14, overflow: 'visible' });

export const tailFill = styleVariants({
  amarillo: { fill: colors.yellowSoft },
  blanco: { fill: colors.white },
  rojo: { fill: colors.redSoft },
});

export const tailLine = style({ fill: 'none', stroke: colors.black, strokeWidth: 2 });
