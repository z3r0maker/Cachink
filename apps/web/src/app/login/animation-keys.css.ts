import { keyframes } from '@vanilla-extract/css';

/** The design file's own keyframes, transcribed byte for byte (P-02). */

export const ESCENA_IN = keyframes({
  from: { opacity: 0, transform: 'translateY(10px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const ESCENA_OUT = keyframes({
  to: { opacity: 0, transform: 'translateY(-8px)' },
});

export const PRENSA = keyframes({
  '0%, 14%': { transform: 'none', boxShadow: '3px 3px 0 #0D0D0D' },
  '20%, 30%': { transform: 'translate(2px,2px)', boxShadow: '1px 1px 0 #0D0D0D' },
  '38%, 100%': { transform: 'none', boxShadow: '3px 3px 0 #0D0D0D' },
});

export const VUELO = keyframes({
  '0%, 26%': { opacity: 0, transform: 'translate(calc(-100% - 60px),-74px) scale(.7)' },
  '33%': { opacity: 1, transform: 'translate(calc(-100% - 60px),-82px) scale(1.06)' },
  '66%': { opacity: 1, transform: 'translate(0,0) scale(1)' },
  '74%, 100%': { opacity: 0, transform: 'translate(0,5px) scale(.9)' },
});

export const FILA_ATERRIZA = keyframes({
  '0%, 64%': { opacity: 0, transform: 'translateY(8px)' },
  '74%, 100%': { opacity: 1, transform: 'translateY(0)' },
});

export const MONEDA_CAE = keyframes({
  '0%': { opacity: 0, transform: 'translateY(-150px) rotate(-40deg) scale(.8)' },
  '22%': { opacity: 1 },
  '42%': { transform: 'translateY(0) rotate(0deg) scale(1)' },
  '50%': { transform: 'translateY(-14px) rotate(4deg)' },
  '58%': { transform: 'translateY(0) rotate(0deg)' },
  '64%': { transform: 'translateY(-5px)' },
  '70%, 100%': { opacity: 1, transform: 'translateY(0) rotate(0deg)' },
});

export const DESTELLO = keyframes({
  '0%, 30%': { opacity: 0, transform: 'scale(.4) rotate(0deg)' },
  '44%': { opacity: 1, transform: 'scale(1.15) rotate(25deg)' },
  '70%, 100%': { opacity: 0, transform: 'scale(.6) rotate(45deg)' },
});

export const TICKET_BAJA = keyframes({
  '0%': { transform: 'translateY(-102%)' },
  '34%, 100%': { transform: 'translateY(0)' },
});

export const LINEA_IMPRIME = keyframes({
  from: { opacity: 0, transform: 'scaleX(0)' },
  to: { opacity: 1, transform: 'scaleX(1)' },
});

export const DOBLA = keyframes({
  '0%, 66%': { opacity: 0, transform: 'scale(.7) rotate(-6deg)' },
  '76%': { opacity: 1, transform: 'scale(1.04) rotate(1deg)' },
  '86%, 100%': { opacity: 1, transform: 'scale(1) rotate(0deg)' },
});

export const BARRA_CREE = keyframes({
  from: { transform: 'scaleY(0)' },
  to: { transform: 'scaleY(1)' },
});

export const INSIGNIA_POP = keyframes({
  '0%, 42%': { opacity: 0, transform: 'scale(.6)' },
  '52%': { opacity: 1, transform: 'scale(1.08)' },
  '62%, 100%': { opacity: 1, transform: 'scale(1)' },
});
