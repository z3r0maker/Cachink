import { createVar, globalStyle, keyframes, style } from '@vanilla-extract/css';
import { colors, consoleMotion as cm, shadows, shapeRadii } from '@xangarro/tokens';

/**
 * «Empresa»'s eleven motions (ADR-161, canvas CD-21), over `consoleMotion`.
 * They run once when a screen opens and settle within 1.5 s; «Vivo» pulses
 * three times and stops. CSS only: the console's CSP has no
 * `'unsafe-inline'`, so a delay, a digit or a bar's length comes from
 * structure (`:nth-child()`, a class per digit, `pathLength="1"`), never from
 * an inline value. Every animated class turns off under reduced motion, and
 * what is left is the static board: figures, bars and strokes at their value.
 */
const REDUCE = '(prefers-reduced-motion: reduce)';
const ms = (n: number) => `${n}ms`;
const quieto = { '@media': { [REDUCE]: { animation: 'none' } } } as const;
const { duration: d, easing: e } = cm;

/**
 * How long an element waits for its turn: set by the stagger rules below on
 * an item, inherited by everything inside it, so a tile's digits and a row's
 * bar start with the tile or the row. `base` is a drawer's wait for its panel.
 */
export const espera = createVar();
export const base = createVar();
const turno = (propia = 0) => `calc(var(${base}, 0ms) + var(${espera}, 0ms) + ${ms(propia)})`;

const animar = (nombre: string, ms_: number, curva: string, propia = 0) => ({
  animation: `${nombre} ${ms(ms_)} ${curva} both`,
  animationDelay: turno(propia),
  ...quieto,
});

/** Rejilla: a still 1 px grid every 32 px at 5 % ink, behind every Empresa page. */
const hilo = `color-mix(in srgb, ${colors.black} 5%, transparent)`;
export const rejilla = style({
  backgroundImage: `linear-gradient(${hilo} 1px, transparent 1px), linear-gradient(90deg, ${hilo} 1px, transparent 1px)`,
  backgroundSize: '32px 32px',
});

/** Entra: rises and fades in, in its container's turn. */
const subir = keyframes({
  from: { opacity: 0, transform: `translateY(${cm.distance.enterPx}px)` },
  to: { opacity: 1, transform: 'none' },
});
export const entra = style(animar(subir, d.enter, e.out));

/** The stagger: 40 ms per item up to the cap, then the rest arrive with the last. */
function escalonar(clase: string, paso: number, tope: number): void {
  for (let n = 2; n <= tope + 1; n += 1) {
    const ultimo = n === tope + 1;
    globalStyle(`${clase} > :nth-child(${ultimo ? `n+${n}` : n})`, {
      vars: { [espera]: ms((n - 1) * paso) },
    });
  }
}
export const escalona = style({});
escalonar(escalona, cm.stagger.step, cm.stagger.cap);

/** The Resultados waterfall: 60 ms a step, each step a direct child. */
export const cascada = style({});
escalonar(cascada, cm.stagger.waterfallStep, cm.stagger.waterfallCap);

/** Aterriza: the hero arrives lifted and settles on its own hard shadow. Never hidden. */
const levantada = (sombra: string, px: number) =>
  sombra.replace(/^(\d+)px (\d+)px/, (_, x: string, y: string) => `${+x + px}px ${+y + px}px`);
const posarse = keyframes({
  from: {
    transform: `translate(-${cm.distance.landPx}px, -${cm.distance.landPx}px)`,
    boxShadow: levantada(shadows.hero, cm.distance.landPx),
  },
});
export const aterriza = style(animar(posarse, d.land, e.out));

/** Barrido: one yellow band across the hero card, once, 200 ms after it opens. */
const cruzar = keyframes({
  from: { transform: 'translateX(-100%)' },
  to: { transform: 'translateX(240%)' },
});
export const barrido = style({ position: 'relative', overflow: 'hidden', isolation: 'isolate' });
globalStyle(`${barrido}::after`, {
  content: '""',
  position: 'absolute',
  inset: '0 auto 0 0',
  width: '45%',
  background: `linear-gradient(90deg, transparent, ${cm.color.sweepBand}, transparent)`,
  pointerEvents: 'none',
  animation: `${cruzar} ${ms(d.sweep)} ${e.sweep} ${ms(cm.delay.sweep)} 1 both`,
  '@media': { [REDUCE]: { display: 'none' } },
});

/** Crece: a bar grows from the axis. Baja: a waterfall cost hangs from the level before it. */
const escalar = keyframes({ from: { transform: 'scaleY(0)' }, to: { transform: 'scaleY(1)' } });
const barraSvg = { transformBox: 'fill-box' } as const;
export const crece = style({
  ...barraSvg,
  transformOrigin: '50% 100%',
  ...animar(escalar, d.grow, e.out),
});
export const baja = style({
  ...barraSvg,
  transformOrigin: '50% 0',
  ...animar(escalar, d.grow, e.out),
});

/** Llena: a bar fills from the left; `despues` is an over-limit excess, after its bar. */
const llenar = keyframes({ from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } });
const desdeLaIzquierda = { ...barraSvg, transformOrigin: '0 50%' } as const;
export const llena = style({ ...desdeLaIzquierda, ...animar(llenar, d.fill, e.out) });
export const llenaDespues = style({
  ...desdeLaIzquierda,
  ...animar(llenar, d.fill, e.out, d.fill),
});

/** Traza: a stroke drawn start to end; the element carries `pathLength="1"`. */
const trazar = keyframes({ from: { strokeDashoffset: 1 }, to: { strokeDashoffset: 0 } });
export const traza = style({ strokeDasharray: 1, ...animar(trazar, d.draw, e.out) });

/** Vivo: a green ring opens around the «en curso» dot three times, then the dot rests. */
const latir = keyframes({
  '0%': { boxShadow: `0 0 0 0 ${cm.color.pulseRing}` },
  '70%': { boxShadow: '0 0 0 8px transparent' },
  '100%': { boxShadow: '0 0 0 0 transparent' },
});
export const vivo = style({
  display: 'inline-block',
  flex: '0 0 auto',
  width: 8,
  height: 8,
  marginRight: 8,
  verticalAlign: 'middle',
  borderRadius: shapeRadii.pill,
  background: colors.green,
  animation: `${latir} ${ms(d.pulse)} ${e.pulse} ${cm.pulse.count}`,
  animationDelay: turno(),
  ...quieto,
});

/** Sello: lands from 1.35× and −8°, bounces once and sits straight (ADR-161 §2). */
const sellar = keyframes({
  '0%': { opacity: 0, transform: 'scale(1.35) rotate(-8deg)' },
  '60%': { opacity: 1 },
  '100%': { opacity: 1, transform: 'none' },
});
/** On a chip that is a block, an inline-block or a flex item: an inline box takes no transform. */
export const sello = style(animar(sellar, d.stamp, e.stamp));

/**
 * Panel: El Mostrador §6's slide (280 ms, the scrim 160 ms; those two values
 * are §6's, not `consoleMotion`'s), then the drawer's content enters, item
 * after item, once the panel has arrived.
 */
const SEIS = { slide: 280, scrim: 160 } as const;
const deslizar = keyframes({ from: { transform: 'translateX(100%)' } });
const velar = keyframes({ from: { opacity: 0 } });
export const cajon = style({ animation: `${deslizar} ${ms(SEIS.slide)} ${e.out} both`, ...quieto });
globalStyle(`${cajon}::backdrop`, {
  animation: `${velar} ${ms(SEIS.scrim)} ${e.sweep} both`,
  ...quieto,
});
export const panel = style({ vars: { [base]: ms(cm.delay.panelContent) } });
globalStyle(`${panel} > *`, animar(subir, d.enter, e.out));
escalonar(panel, cm.stagger.step, cm.stagger.cap);
