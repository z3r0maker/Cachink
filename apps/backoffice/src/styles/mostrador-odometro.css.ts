import { globalStyle, keyframes, style, styleVariants } from '@vanilla-extract/css';
import { consoleMotion as cm } from '@xangarro/tokens';

import { base, espera } from './mostrador-movimiento.css';

/**
 * «Odómetro» (ADR-161 §2, canvas CD-21), the eleventh motion of
 * `mostrador-movimiento.css.ts`, kept beside it for the line budget. Each
 * digit spins one full turn of a two-turn strip and stops on its value,
 * 560 ms on the right to 800 ms on the left. The strip is generated content
 * and the digit a class, so the figure needs no script and is never `$0`;
 * `Odometro` puts the real figure beside it for readers, copying and specs.
 * It starts in its tile's turn (the stagger's `espera`).
 */
const REDUCE = '(prefers-reduced-motion: reduce)';
const ms = (n: number) => `${n}ms`;
const linea = cm.distance.odometerLineEm;

export const odometro = style({
  display: 'inline-flex',
  alignItems: 'flex-start',
  verticalAlign: 'top',
  lineHeight: linea,
  fontVariantNumeric: 'tabular-nums',
});

const ventana = {
  display: 'block',
  height: `${linea}em`,
  overflow: 'hidden',
  whiteSpace: 'pre',
} as const;

/** The window one digit's strip turns behind. */
export const od = style(ventana);

/** A comma, a sign, a space or a letter: drawn from its `data-c`, so it adds no text of its own. */
export const odSep = style({ ...ventana, '::before': { content: 'attr(data-c)' } });

/** «0\A 1\A … 9\A 0\A … 9»: two turns, one digit a line. */
const tira = Array.from({ length: 20 }, (_, i) => i % 10).join('\\A ');
const rodar = keyframes({ from: { transform: 'translateY(0)' } });

export const odTira = style({
  display: 'block',
  '::before': { content: `"${tira}"`, display: 'block', whiteSpace: 'pre' },
  animation: `${rodar} ${ms(cm.duration.rollFastest)} ${cm.easing.out} both`,
  animationDelay: `calc(var(${base}, 0ms) + var(${espera}, 0ms))`,
  '@media': { [REDUCE]: { animation: 'none' } },
});

type Digito = `${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

/** Where each digit stops: on the strip's second turn, so every digit spins a full one. */
export const digito = styleVariants(
  Object.fromEntries(
    Array.from({ length: 10 }, (_, n) => [
      String(n),
      { transform: `translateY(-${((10 + n) * linea).toFixed(2)}em)` },
    ]),
  ) as Record<Digito, { transform: string }>,
);

/** Slower to the left: 48 ms more a place, the sixth place and beyond at the slowest. */
const LUGARES = 5;
for (let k = 2; k <= LUGARES + 1; k += 1) {
  const { rollFastest: rapido, rollSlowest: lento } = cm.duration;
  const cual = k === LUGARES + 1 ? `n+${k}` : `${k}`;
  globalStyle(`${odometro} > :nth-last-child(${cual}) ${odTira}`, {
    animationDuration: ms(rapido + ((lento - rapido) * (k - 1)) / LUGARES),
  });
}

/** The figure in full, for screen readers, copying and the specs; never seen. */
export const leible = style({
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
});
