import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { colors, consoleMotion } from '../src/index.js';
import {
  motionBudgetViolations,
  patternEnds,
  PULSE_LIMIT_MS,
  SETTLE_BUDGET_MS,
} from '../src/console-motion-budget.js';
import type { ConsoleMotion } from '../src/console-motion.js';

/** A copy of the real tokens with one group overridden, for the unhappy paths. */
function tweak<K extends keyof ConsoleMotion>(
  key: K,
  patch: Partial<ConsoleMotion[K]>,
): ConsoleMotion {
  return { ...consoleMotion, [key]: { ...consoleMotion[key], ...patch } };
}

describe('consoleMotion holds ADR-161 §5', () => {
  it('has the durations, delays, steps and counts the ADR lists', () => {
    assert.deepEqual(consoleMotion.duration, {
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
    });
    assert.deepEqual(consoleMotion.delay, { sweep: 200, panelContent: 200 });
    assert.equal(consoleMotion.stagger.step, 40);
    assert.equal(consoleMotion.stagger.cap, 6);
    assert.equal(consoleMotion.stagger.waterfallStep, 60);
    assert.equal(consoleMotion.pulse.count, 3);
  });

  it('has the distances, the odometer line and the curves', () => {
    assert.deepEqual(consoleMotion.distance, { enterPx: 12, landPx: 6, odometerLineEm: 1.1 });
    assert.equal(consoleMotion.easing.out, 'cubic-bezier(0.2, 0.8, 0.2, 1)');
    assert.equal(consoleMotion.easing.stamp, 'cubic-bezier(0.34, 1.56, 0.64, 1)');
    assert.equal(consoleMotion.easing.sweep, 'ease-out');
    assert.equal(consoleMotion.easing.pulse, 'ease-out');
  });

  it('builds its two colours from the palette, not from new hex values', () => {
    assert.equal(consoleMotion.color.sweepBand, 'rgba(255, 214, 10, 0.32)');
    assert.equal(colors.yellow, '#FFD60A');
    assert.equal(consoleMotion.color.pulseRing, 'rgba(0, 200, 150, 0.6)');
    assert.equal(colors.green, '#00C896');
  });
});

describe('the motion budget (ADR-161 §3)', () => {
  it('passes for the real tokens', () => {
    assert.deepEqual(motionBudgetViolations(consoleMotion), []);
  });

  it('settles every pattern within 1.5 s, the sweep last and the waterfall at 1.1 s', () => {
    const ends = patternEnds(consoleMotion);
    for (const [pattern, end] of Object.entries(ends)) {
      assert.ok(end <= SETTLE_BUDGET_MS, `${pattern} ends at ${end} ms`);
    }
    assert.equal(ends.barrido, 1400);
    assert.ok(ends.cascada <= 1100, `the waterfall ends at ${ends.cascada} ms`);
    const others = Object.entries(ends).filter(([p]) => p !== 'barrido' && p !== 'cascada');
    // «Everything else before 0.8 s»: the odometer's leftmost digit stops at 800 ms.
    for (const [pattern, end] of others) assert.ok(end <= 800, `${pattern} ends at ${end} ms`);
  });

  it('keeps «Vivo» inside WCAG 2.2.2, so it needs no pause control', () => {
    const { count } = consoleMotion.pulse;
    assert.ok(count * consoleMotion.duration.pulse < PULSE_LIMIT_MS);
  });

  it('fails when a duration is raised past the budget', () => {
    const violations = motionBudgetViolations(tweak('duration', { fill: 1600 }));
    assert.deepEqual(violations, ['llena settles at 1600 ms, past the 1500 ms budget']);
  });

  it('fails when the stagger cap lets the last card arrive too late', () => {
    const violations = motionBudgetViolations(tweak('stagger', { cap: 30 }));
    assert.ok(violations.includes('entra settles at 1520 ms, past the 1500 ms budget'));
    assert.ok(violations.includes('panel settles at 1720 ms, past the 1500 ms budget'));
  });

  it('fails when the waterfall gets more steps than 1.5 s holds', () => {
    const violations = motionBudgetViolations(tweak('stagger', { waterfallCap: 20 }));
    assert.deepEqual(violations, ['cascada settles at 1680 ms, past the 1500 ms budget']);
  });

  it('fails when «Vivo» pulses long enough to need a pause control', () => {
    const violations = motionBudgetViolations(tweak('pulse', { count: 4 }));
    assert.deepEqual(violations, ['vivo pulses for 6400 ms, not under the 5000 ms of WCAG 2.2.2']);
  });

  it('fails when the sweep is no longer the last thing to settle', () => {
    const violations = motionBudgetViolations(tweak('duration', { draw: 1450 }));
    assert.deepEqual(violations, ['traza settles at 1450 ms, after the sweep (1400 ms)']);
  });

  it('fails when the odometer’s rightmost digit is slower than its leftmost', () => {
    const violations = motionBudgetViolations(tweak('duration', { rollFastest: 900 }));
    assert.deepEqual(violations, [
      'odómetro rolls its rightmost digit (900 ms) after its leftmost (800 ms)',
    ]);
  });
});
