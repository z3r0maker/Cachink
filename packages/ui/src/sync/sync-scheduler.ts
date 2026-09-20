/**
 * SyncScheduler — decides WHEN sync runs (A-07, docs/plan Q3). Pure: timers
 * are injected so the policy is unit-testable with fake timers.
 *
 *   - Local write        → push after a 2 s debounce (a sale leaves the phone
 *                          within seconds; bursts collapse into one push).
 *   - Foreground/resume  → full sync (push then pull).
 *   - While in foreground → full sync every 15 min.
 *   - Background         → nothing scheduled (iOS can't be relied on).
 */

export const PUSH_DEBOUNCE_MS = 2_000;
export const PULL_INTERVAL_MS = 15 * 60_000;

type TimerId = ReturnType<typeof setTimeout>;

export interface SchedulerDeps {
  readonly runPush: () => void;
  readonly runSync: () => void;
  readonly setTimeout?: (fn: () => void, ms: number) => TimerId;
  readonly clearTimeout?: (id: TimerId) => void;
  readonly setInterval?: (fn: () => void, ms: number) => TimerId;
  readonly clearInterval?: (id: TimerId) => void;
}

export class SyncScheduler {
  readonly #deps: SchedulerDeps;
  #debounce: TimerId | null = null;
  #interval: TimerId | null = null;

  constructor(deps: SchedulerDeps) {
    this.#deps = deps;
  }

  /** App became active (launch, resume, activation just finished). */
  onForeground(): void {
    this.#deps.runSync();
    this.#stopInterval();
    const setIntervalFn = this.#deps.setInterval ?? setInterval;
    this.#interval = setIntervalFn(() => this.#deps.runSync(), PULL_INTERVAL_MS);
  }

  /** App went to background: stop timers; pending writes wait for resume. */
  onBackground(): void {
    this.#stopInterval();
    this.#cancelDebounce();
  }

  /** A local write committed: push soon, collapsing bursts. */
  noteWrite(): void {
    this.#cancelDebounce();
    const setTimeoutFn = this.#deps.setTimeout ?? setTimeout;
    this.#debounce = setTimeoutFn(() => {
      this.#debounce = null;
      this.#deps.runPush();
    }, PUSH_DEBOUNCE_MS);
  }

  dispose(): void {
    this.onBackground();
  }

  #cancelDebounce(): void {
    if (this.#debounce === null) return;
    (this.#deps.clearTimeout ?? clearTimeout)(this.#debounce);
    this.#debounce = null;
  }

  #stopInterval(): void {
    if (this.#interval === null) return;
    (this.#deps.clearInterval ?? clearInterval)(this.#interval);
    this.#interval = null;
  }
}
