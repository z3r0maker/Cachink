import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';

import {
  INTERVALO_PULL_MS,
  PULL_MIN_MS,
  programarPulls,
  type Visibilidad,
} from '../../src/operador/runtime/pull-periodico';

/**
 * DB3-CAJA-03: an idle caja pulls on boot, when its tab comes back into view
 * and every 5 min ±20 % while visible — so a price, an operator's NIP or a
 * deactivation reaches it without waiting for the next sale.
 */

class Pestana implements Visibilidad {
  visibilityState: DocumentVisibilityState = 'visible';
  readonly #oyentes = new Set<() => void>();
  addEventListener(_: 'visibilitychange', fn: () => void): void {
    this.#oyentes.add(fn);
  }
  removeEventListener(_: 'visibilitychange', fn: () => void): void {
    this.#oyentes.delete(fn);
  }
  mostrar(estado: DocumentVisibilityState): void {
    this.visibilityState = estado;
    for (const fn of this.#oyentes) fn();
  }
  get oyentes(): number {
    return this.#oyentes.size;
  }
}

describe('programarPulls · the idle caja stays current (DB3-CAJA-03)', () => {
  let doc: Pestana;
  let pull: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-09-26T12:00:00Z') });
    doc = new Pestana();
    pull = vi.fn();
  });
  afterEach(() => vi.useRealTimers());

  it('pulls on boot, then every 5 minutes give or take 20 %', () => {
    const parar = programarPulls(pull, { doc, random: () => 0 });
    assert.equal(pull.mock.calls.length, 1, 'boot');
    vi.advanceTimersByTime(INTERVALO_PULL_MS * 0.8 - 1);
    assert.equal(pull.mock.calls.length, 1);
    vi.advanceTimersByTime(1);
    assert.equal(pull.mock.calls.length, 2, 'the low edge of the jitter');
    parar();
  });

  it('spreads the interval up to +20 %, so a shop’s cajas do not pull in step', () => {
    const parar = programarPulls(pull, { doc, random: () => 1 });
    vi.advanceTimersByTime(INTERVALO_PULL_MS * 1.2 - 1);
    assert.equal(pull.mock.calls.length, 1);
    vi.advanceTimersByTime(1);
    assert.equal(pull.mock.calls.length, 2);
    parar();
  });

  it('stops the timer while the tab is hidden, and pulls when it is visible again', () => {
    const parar = programarPulls(pull, { doc, random: () => 0.5 });
    vi.advanceTimersByTime(PULL_MIN_MS);
    doc.mostrar('hidden');
    vi.advanceTimersByTime(INTERVALO_PULL_MS * 3);
    assert.equal(pull.mock.calls.length, 1, 'a hidden tab never pulls on its timer');
    doc.mostrar('visible');
    assert.equal(pull.mock.calls.length, 2, 'back in view: pull now');
    vi.advanceTimersByTime(INTERVALO_PULL_MS);
    assert.equal(pull.mock.calls.length, 3, 'and the timer is armed again');
    parar();
  });

  it('does not pull again on a quick tab switch right after a pull', () => {
    const parar = programarPulls(pull, { doc, random: () => 0.5 });
    doc.mostrar('hidden');
    vi.advanceTimersByTime(PULL_MIN_MS - 1);
    doc.mostrar('visible');
    assert.equal(pull.mock.calls.length, 1, 'boot was less than 45 s ago');
    parar();
  });

  it('stops for good: no timer, no listener', () => {
    const parar = programarPulls(pull, { doc, random: () => 0.5 });
    parar();
    assert.equal(doc.oyentes, 0);
    vi.advanceTimersByTime(INTERVALO_PULL_MS * 2);
    doc.mostrar('visible');
    assert.equal(pull.mock.calls.length, 1);
  });
});
