/**
 * SyncScheduler — decides WHEN sync runs (A-07, docs/plan Q3). Pure: timers
 * and randomness are injected so the policy is unit-testable with fake timers.
 *
 *   - Local write        → push after a 2 s debounce (a sale leaves the phone
 *                          within seconds; bursts collapse into one push).
 *   - Foreground/resume  → full sync (push then pull).
 *   - While in foreground → full sync every 15 min ± 20 %, so the phones of a
 *                          shop (and of every shop) don't tick in step at the
 *                          evening peak (DB2-DEV-02).
 *   - After a failed run → one retry when the engine's backoff ends (`retryIn`).
 *   - Background         → nothing scheduled (iOS can't be relied on).
 */

import { spread, type Random } from '@xangarro/sync';

export const PUSH_DEBOUNCE_MS = 2_000;
export const PULL_INTERVAL_MS = 15 * 60_000;
/** The foreground tick lands anywhere in 12–18 min. */
export const PULL_INTERVAL_JITTER = 0.2;

type TimerId = ReturnType<typeof setTimeout>;

export interface SchedulerDeps {
  readonly runPush: () => void;
  readonly runSync: () => void;
  readonly setTimeout?: (fn: () => void, ms: number) => TimerId;
  readonly clearTimeout?: (id: TimerId) => void;
  readonly random?: Random;
}

export class SyncScheduler {
  readonly #deps: SchedulerDeps;
  #debounce: TimerId | null = null;
  #tick: TimerId | null = null;
  #retry: TimerId | null = null;

  constructor(deps: SchedulerDeps) {
    this.#deps = deps;
  }

  /** App became active (launch, resume, activation just finished). */
  onForeground(): void {
    this.#deps.runSync();
    this.#scheduleTick();
  }

  /** App went to background: stop timers; pending writes wait for resume. */
  onBackground(): void {
    this.#debounce = this.#clear(this.#debounce);
    this.#tick = this.#clear(this.#tick);
    this.#retry = this.#clear(this.#retry);
  }

  /** A local write committed: push soon, collapsing bursts. */
  noteWrite(): void {
    this.#clear(this.#debounce);
    this.#debounce = this.#set(() => {
      this.#debounce = null;
      this.#deps.runPush();
    }, PUSH_DEBOUNCE_MS);
  }

  /** The engine's backoff ends in `ms`: sync then (replaces an earlier retry). */
  retryIn(ms: number): void {
    this.#clear(this.#retry);
    this.#retry = this.#set(
      () => {
        this.#retry = null;
        this.#deps.runSync();
      },
      Math.max(0, ms),
    );
  }

  dispose(): void {
    this.onBackground();
  }

  #scheduleTick(): void {
    this.#clear(this.#tick);
    const every = spread(PULL_INTERVAL_MS, PULL_INTERVAL_JITTER, this.#deps.random ?? Math.random);
    this.#tick = this.#set(() => {
      this.#tick = null;
      this.#deps.runSync();
      this.#scheduleTick();
    }, every);
  }

  #set(fn: () => void, ms: number): TimerId {
    return (this.#deps.setTimeout ?? setTimeout)(fn, ms);
  }

  /** Clears `id` if set; always returns null so callers can reset their slot. */
  #clear(id: TimerId | null): null {
    if (id !== null) (this.#deps.clearTimeout ?? clearTimeout)(id);
    return null;
  }
}
