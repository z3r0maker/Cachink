import type { ConsoleMotion } from './console-motion.js';

/** ADR-161 §3: every pattern has settled this long after the screen opens. */
export const SETTLE_BUDGET_MS = 1500;

/** WCAG 2.2.2: anything that moves longer than this needs a pause control. */
export const PULSE_LIMIT_MS = 5000;

/** The patterns that run once and settle. «Rejilla» never moves; «Vivo» has its own rule. */
export type SettlingPattern =
  | 'entra'
  | 'aterriza'
  | 'odometro'
  | 'barrido'
  | 'crece'
  | 'cascada'
  | 'llena'
  | 'traza'
  | 'sello'
  | 'panel';

/**
 * When each pattern has settled, in ms after the screen opens: its delay, its
 * duration and, where it staggers, the wait of its last item (`step × cap`).
 */
export function patternEnds(m: ConsoleMotion): Readonly<Record<SettlingPattern, number>> {
  const { duration: d, stagger: s } = m;
  const lastStagger = s.step * s.cap;
  return {
    entra: d.enter + lastStagger,
    aterriza: d.land,
    odometro: d.rollSlowest,
    barrido: m.delay.sweep + d.sweep,
    crece: d.grow + lastStagger,
    cascada: d.grow + s.waterfallStep * s.waterfallCap,
    llena: d.fill,
    traza: d.draw,
    sello: d.stamp,
    panel: m.delay.panelContent + d.enter + lastStagger,
  };
}

/**
 * Every way a set of motion values breaks ADR-161's rules, in words; an empty
 * list means it keeps them. Pure, so a test can hand it altered copies.
 */
export function motionBudgetViolations(m: ConsoleMotion): string[] {
  const ends = patternEnds(m);
  const violations: string[] = [];
  for (const [pattern, end] of Object.entries(ends)) {
    if (end > SETTLE_BUDGET_MS) {
      violations.push(`${pattern} settles at ${end} ms, past the ${SETTLE_BUDGET_MS} ms budget`);
    } else if (pattern !== 'barrido' && end > ends.barrido) {
      violations.push(`${pattern} settles at ${end} ms, after the sweep (${ends.barrido} ms)`);
    }
  }
  const { rollFastest, rollSlowest } = m.duration;
  if (rollFastest > rollSlowest) {
    violations.push(
      `odómetro rolls its rightmost digit (${rollFastest} ms) after its leftmost (${rollSlowest} ms)`,
    );
  }
  const pulsing = m.pulse.count * m.duration.pulse;
  if (pulsing >= PULSE_LIMIT_MS) {
    violations.push(
      `vivo pulses for ${pulsing} ms, not under the ${PULSE_LIMIT_MS} ms of WCAG 2.2.2`,
    );
  }
  return violations;
}
