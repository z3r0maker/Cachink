/**
 * SyncScheduler — decides WHEN sync runs (A-07, docs/plan Q3). Pure: timers
 * and randomness are injected so the policy is unit-testable with fake timers.
 *
 *   - Local write        → push after a 2 s debounce (a sale leaves the phone
 *                          within seconds; bursts collapse into one push).
 *   - Foreground/resume  → full sync (push then pull) — or only a push when
 *                          the last full sync is under 45 s old, as after a
 *                          capture: the phone must not pull on every return
 *                          to the app (DB3-L-02).
 *   - While in foreground → full sync every 15 min ± 20 %, so the phones of a
 *                          shop (and of every shop) don't tick in step at the
 *                          evening peak (DB2-DEV-02).
 *   - After a failed run → one retry when the engine's backoff ends (`retryIn`).
 *   - Background         → nothing scheduled (iOS can't be relied on).
 */

import { PULL_AFTER_CAPTURE_MS, spread, type Random } from '@xangarro/sync';

export const PUSH_DEBOUNCE_MS = 2_000;
export const PULL_INTERVAL_MS = 15 * 60_000;
/** The foreground tick lands anywhere in 12–18 min. */
export const PULL_INTERVAL_JITTER = 0.2;
/** A resume sooner than this after the last full sync only pushes. */
export const RESUME_PULL_MIN_MS = PULL_AFTER_CAPTURE_MS;

type TimerId = ReturnType<typeof setTimeout>;

export interface SchedulerDeps {
  readonly runPush: () => void;
  readonly runSync: () => void;
  readonly setTimeout?: (fn: () => void, ms: number) => TimerId;
  readonly clearTimeout?: (id: TimerId) => void;
  readonly random?: Random;
  /** Epoch ms; injected for tests. */
  readonly now?: () => number;
}

export class SyncScheduler {
  readonly #deps: SchedulerDeps;
  #debounce: TimerId | null = null;
  #tick: TimerId | null = null;
  #retry: TimerId | null = null;
  #lastSyncMs: number | null = null;

  constructor(deps: SchedulerDeps) {
    this.#deps = deps;
  }

  /** App became active (launch, resume, activation just finished). */
  onForeground(): void {
    const last = this.#lastSyncMs;
    if (last !== null && this.#now() - last < RESUME_PULL_MIN_MS) this.#deps.runPush();
    else this.#sync();
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
        this.#sync();
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
      this.#sync();
      this.#scheduleTick();
    }, every);
  }

  #sync(): void {
    this.#lastSyncMs = this.#now();
    this.#deps.runSync();
  }

  #now(): number {
    return (this.#deps.now ?? Date.now)();
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
