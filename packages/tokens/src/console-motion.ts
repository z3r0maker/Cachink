import { colors } from './colors.js';

/**
 * The founders' «Empresa» console's motion values (ADR-161 §5, canvas CD-21).
 *
 * They belong to the `/empresa` routes of `apps/backoffice` and nowhere else:
 * the portal and the phone keep El Mostrador's five motions (§6 of
 * `docs/design/el-mostrador.md`), and an ESLint `no-restricted-imports` rule in
 * `packages/config` refuses `consoleMotion` outside `apps/backoffice`.
 *
 * Every pattern runs once when a screen opens and settles within 1.5 s; «Vivo»
 * pulses three times and stops inside WCAG 2.2.2's five seconds.
 * `console-motion-budget.ts` holds those rules and `tests/console-motion.test.ts`
 * runs it, so a value raised here past the budget fails the build.
 */
export interface ConsoleMotion {
  /** Pattern durations, in milliseconds. */
  readonly duration: {
    /** «Sello»: a status chip lands, bounces once and sits straight. */
    readonly stamp: number;
    /** «Entra»: a card or row rises and fades in. */
    readonly enter: number;
    /** «Aterriza»: the hero card settles on its hard shadow. */
    readonly land: number;
    /** «Crece»: a bar grows from the axis (or hangs, in the waterfall). */
    readonly grow: number;
    /** «Llena»: a bar fills from the left. */
    readonly fill: number;
    /** «Traza»: a line or checkmark draws from start to end. */
    readonly draw: number;
    /** «Odómetro»: the rightmost digit's turn, the quickest. */
    readonly rollFastest: number;
    /** «Odómetro»: the leftmost digit's turn, the slowest. */
    readonly rollSlowest: number;
    /** «Barrido»: the yellow band's crossing of the hero card. */
    readonly sweep: number;
    /** «Vivo»: one pulse of the ring around the «en curso» dot. */
    readonly pulse: number;
  };
  /** Waits before a pattern starts, in milliseconds. */
  readonly delay: {
    /** «Barrido» starts this long after the screen opens. */
    readonly sweep: number;
    /** «Panel»: a drawer's content enters this long after the panel. */
    readonly panelContent: number;
  };
  /** One-after-another timing, generated as `:nth-child()` rules up to each cap. */
  readonly stagger: {
    /** Milliseconds between two cards, rows or bars. */
    readonly step: number;
    /** The last staggered item waits `step × cap`; later ones arrive with it. */
    readonly cap: number;
    /** Milliseconds between two steps of the Resultados waterfall. */
    readonly waterfallStep: number;
    /** The waterfall's last step waits `waterfallStep × waterfallCap`. */
    readonly waterfallCap: number;
  };
  readonly pulse: {
    /** «Vivo» pulses this many times, then the dot stays still. */
    readonly count: number;
  };
  readonly distance: {
    /** «Entra» rises from this many px below its place. */
    readonly enterPx: number;
    /** «Aterriza» arrives lifted this many px. */
    readonly landPx: number;
    /** The odometer's digit line height, in em. */
    readonly odometerLineEm: number;
  };
  /** Timing functions, as CSS writes them. */
  readonly easing: {
    /** Every entering, growing, filling and drawing pattern. */
    readonly out: string;
    /** «Sello»'s single overshoot. */
    readonly stamp: string;
    readonly sweep: string;
    readonly pulse: string;
  };
  readonly color: {
    /** «Barrido»'s band: the brand yellow at 32 %. */
    readonly sweepBand: string;
    /** «Vivo»'s ring: the status green at 60 %. */
    readonly pulseRing: string;
  };
}

/** A palette `#RRGGBB` token at an opacity, so no translucent colour is typed by hand. */
function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const consoleMotion = {
  duration: {
    stamp: 240,
    enter: 320,
    land: 320,
    grow: 480,
    fill: 520,
    draw: 600,
    rollFastest: 560,
    rollSlowest: 800,
    sweep: 1200,
    pulse: 1600,
  },
  delay: { sweep: 200, panelContent: 200 },
  // ADR-161 §3 has the waterfall settled at 1.1 s: 480 + 10 × 60 = 1080 ms.
  stagger: { step: 40, cap: 6, waterfallStep: 60, waterfallCap: 10 },
  pulse: { count: 3 },
  distance: { enterPx: 12, landPx: 6, odometerLineEm: 1.1 },
  easing: {
    // The portal's Estados charts already use this curve.
    out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    stamp: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    sweep: 'ease-out',
    pulse: 'ease-out',
  },
  color: {
    sweepBand: withAlpha(colors.yellow, 0.32),
    pulseRing: withAlpha(colors.green, 0.6),
  },
} as const satisfies ConsoleMotion;
