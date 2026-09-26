/**
 * Backoff and jitter for the evening peak (DB2-DEV-02). At 17:00–20:00 a
 * shop's phones and cajas reconnect together; without jitter every retry,
 * tick and flush lands in the same second, and without backoff a failing
 * server is retried on every trigger. Pure: randomness is injected.
 */

export type Random = () => number;

/** First wait after a failed run, doubled per consecutive failure. */
export const RUN_BACKOFF_BASE_MS = 5_000;
/** The longest the engine waits on its own between automatic runs. */
export const RUN_BACKOFF_MAX_MS = 5 * 60_000;
/** A Retry-After longer than this is a misconfigured server, not a plan. */
const MAX_SERVER_WAIT_MS = 60 * 60_000;
/** Devices told the same Retry-After come back up to 20 % later, not together. */
const SERVER_WAIT_SPREAD = 0.2;

/** Between half and all of `ms`: spreads retries, never waits longer than the schedule. */
export function equalJitter(ms: number, random: Random): number {
  return ms / 2 + (random() * ms) / 2;
}

/** `ms` moved by up to ±`fraction` (a periodic tick that must not align across devices). */
export function spread(ms: number, fraction: number, random: Random): number {
  return Math.round(ms * (1 - fraction + 2 * fraction * random()));
}

/** What the engine remembers of a failed run: the code and, if sent, Retry-After. */
export interface RunFailure {
  readonly code: string;
  readonly status: number;
  readonly retryAfterMs?: number;
}

/**
 * When the engine may try again after runs that failed as a whole. Automatic
 * triggers wait for both clocks; a person asking (Actualizar, Reintentar
 * envío, back online) skips the engine's own backoff but never the server's
 * Retry-After.
 */
export class RunBackoff {
  readonly #random: Random;
  #failures = 0;
  #until = 0;
  #serverUntil = 0;
  #lastError: RunFailure | null = null;

  constructor(random: Random = Math.random) {
    this.#random = random;
  }

  get lastError(): RunFailure | null {
    return this.#lastError;
  }

  /** The epoch ms the next run must wait for, or null when it may run now. */
  blockedUntil(nowMs: number, manual: boolean): number | null {
    const until = manual ? this.#serverUntil : Math.max(this.#until, this.#serverUntil);
    return until > nowMs ? until : null;
  }

  /** Records a failed run; returns the epoch ms of the next automatic attempt. */
  failed(error: RunFailure, nowMs: number): number {
    this.#failures += 1;
    this.#lastError = error;
    const exp = RUN_BACKOFF_BASE_MS * 2 ** (this.#failures - 1);
    const own = nowMs + equalJitter(Math.min(exp, RUN_BACKOFF_MAX_MS), this.#random);
    const told = error.retryAfterMs;
    this.#serverUntil =
      told === undefined
        ? 0
        : nowMs + Math.min(told, MAX_SERVER_WAIT_MS) * (1 + SERVER_WAIT_SPREAD * this.#random());
    this.#until = Math.max(own, this.#serverUntil);
    return this.#until;
  }

  succeeded(): void {
    this.#failures = 0;
    this.#until = 0;
    this.#serverUntil = 0;
    this.#lastError = null;
  }
}
