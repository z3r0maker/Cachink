import { keyframes, style } from '@vanilla-extract/css';
import { borders, colors, shadows, shapeRadii } from '@xangarro/tokens';

import type { Etapa } from './cortina';

/**
 * The storefront: sign board, awning, the opening with the hero illustration
 * behind the shutter, and Don Cuentas with his hook. Every reaction is a
 * selector on the panel's `data-etapa`, so nothing re-renders to animate.
 *
 * The numbers are the design's own (Portal · Abre tu changarro): a drawing's
 * proportions, not UI spacing.
 */

const LIFT: Readonly<Record<Etapa, number>> = {
  cerrada: 0,
  asomo: 12,
  dueno: 10,
  correo: 36,
  lista: 64,
  abriendo: 100,
  error: 16,
};
const on = (e: Etapa) => `[data-etapa="${e}"] &`;
const each = <T>(f: (e: Etapa) => T) =>
  Object.fromEntries((Object.keys(LIFT) as Etapa[]).map((e) => [on(e), f(e)]));
const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const NARROW = '(max-width: 1023px)';

export const fachada = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  marginTop: 'auto',
});

export const letrero = style({
  alignSelf: 'center',
  position: 'relative',
  zIndex: 2,
  marginBottom: -2,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '8px 10px 8px 24px',
  background: colors.black,
  borderRadius: 12,
});

export const letreroNombre = style({
  fontFamily: 'var(--font-anton), sans-serif',
  fontSize: 'clamp(20px, 2.1vw, 30px)',
  letterSpacing: '0.06em',
  color: colors.yellow,
  whiteSpace: 'nowrap',
});

const prende = keyframes({
  '0%': { transform: 'scale(.8)' },
  '45%': { transform: 'scale(1.15) rotate(-3deg)' },
  '100%': { transform: 'none' },
});

/** «ABIERTO»: an unlit neon until the shutter is all the way up. */
export const foco = style({
  padding: '3px 10px',
  borderRadius: 8,
  border: `2px solid ${colors.gray600}`,
  fontFamily: 'var(--font-anton), sans-serif',
  fontSize: 'clamp(15px, 1.5vw, 21px)',
  letterSpacing: '0.08em',
  color: colors.gray600,
  selectors: {
    [on('abriendo')]: {
      background: colors.green,
      color: colors.black,
      borderColor: colors.white,
      boxShadow: `0 0 0 3px ${colors.black}`,
    },
  },
  '@media': { [MOTION_OK]: { selectors: { [on('abriendo')]: { animation: `${prende} .9s` } } } },
});

export const toldo = style({
  display: 'block',
  width: '100%',
  height: 'auto',
  position: 'relative',
  zIndex: 1,
  overflow: 'visible',
});

export const hueco = style({
  position: 'relative',
  margin: '-4.1% 18px 0',
  aspectRatio: '2.35 / 1',
  border: borders.thick,
  borderTop: 0,
  background: colors.black,
  overflow: 'hidden',
  boxShadow: shadows.hero,
  '@media': { [NARROW]: { margin: '-4.1% 10px 0' } },
});

export const interior = style({ objectFit: 'cover', objectPosition: 'left center' });

export const cortina = style({
  position: 'absolute',
  inset: 0,
  selectors: each((e) => ({ transform: `translateY(-${LIFT[e]}%)` })),
  '@media': { [MOTION_OK]: { transition: 'transform .75s cubic-bezier(.2,.8,.2,1)' } },
});

const golpe = keyframes({
  '0%': { transform: 'translateY(-40%)' },
  '60%': { transform: 'translateY(4%)' },
  '80%': { transform: 'translateY(-2%)' },
  '100%': { transform: 'none' },
});

/** The slats. Re-keyed on every refusal, so each one clunks. */
export const laminas = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: colors.gray200,
  '@media': { [MOTION_OK]: { selectors: { [on('error')]: { animation: `${golpe} .45s` } } } },
});

export const lamina = style({
  flex: 1,
  borderBottom: `2px solid ${colors.black}`,
  boxShadow: `inset 0 3px 0 ${colors.gray100}`,
});

export const cerrado = style({
  position: 'absolute',
  left: '50%',
  top: '36%',
  transform: 'translate(-50%, -50%) rotate(-4deg)',
  padding: '4px 16px',
  background: colors.white,
  border: borders.thick,
  borderRadius: 10,
  boxShadow: shadows.small,
  fontFamily: 'var(--font-anton), sans-serif',
  fontSize: 'clamp(18px, 2.2vw, 30px)',
  letterSpacing: '0.08em',
  color: colors.redText,
});

export const candado = style({
  position: 'absolute',
  left: '50%',
  bottom: '14%',
  width: 40,
  height: 40,
  marginLeft: -20,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 10,
  background: colors.yellow,
  border: borders.thin,
  selectors: {
    [`${on('correo')}, ${on('lista')}, ${on('abriendo')}`]: { visibility: 'hidden' },
  },
});

export const jaladera = style({
  position: 'absolute',
  left: '50%',
  bottom: 10,
  width: 84,
  height: 12,
  marginLeft: -42,
  borderRadius: shapeRadii.pill,
  background: colors.black,
});
