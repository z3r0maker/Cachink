import { style } from '@vanilla-extract/css';

import type { Etapa } from './cortina';

/**
 * Don Cuentas at the corner of the storefront: hauling on the hook while the
 * shutter rises (he leans further back the higher it goes), waving once it is
 * up. Two illustrations cross-faded by the panel's `data-etapa`.
 */
const on = (e: Etapa) => `[data-etapa="${e}"] &`;
const MOTION_OK = '(prefers-reduced-motion: no-preference)';

export const don = style({
  position: 'absolute',
  right: -40,
  bottom: -70,
  zIndex: 4,
  width: 'clamp(170px, 17vw, 250px)',
  aspectRatio: '1 / 1',
  '@media': { '(max-width: 1023px)': { display: 'none' } },
});

const pose = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  transformOrigin: '50% 95%',
  '@media': {
    [MOTION_OK]: { transition: 'opacity .2s, transform .45s cubic-bezier(.3,1.4,.5,1)' },
  },
});

export const jalando = style([
  pose,
  {
    selectors: {
      [on('correo')]: { transform: 'rotate(2deg) translateY(-3px)' },
      [on('lista')]: { transform: 'rotate(4deg) translateY(-5px)' },
      [on('error')]: { transform: 'rotate(-7deg)' },
      [on('abriendo')]: { opacity: 0, transform: 'scale(.9)' },
    },
  },
]);

export const saludando = style([
  pose,
  {
    opacity: 0,
    transform: 'scale(.9)',
    selectors: { [on('abriendo')]: { opacity: 1, transform: 'none' } },
  },
]);
