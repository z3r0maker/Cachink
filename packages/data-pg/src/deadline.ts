import type { Db } from './client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Load shedding for the pool (audit DB3-SYNC-05, ADR-120).
 *
 * postgres.js queues a transaction that finds every connection busy and has no
 * acquire timeout of its own. With two connections per serverless instance, one
 * slow holder stalled every request behind it, and a database outage became
 * thousands of functions each waiting out its limit. A caller that would
 * rather answer «busy, come back in N seconds» than wait gives the transaction
 * a {@link Deadline}, and gets a {@link ServiceBusyError} instead of a hang.
 */
export interface Deadline {
  /** Longest wait for a connection (and its BEGIN), in ms. */
  readonly acquireMs: number;
  /** Epoch ms by which the whole transaction must have finished. */
  readonly until: number;
}

export type BusyPhase = 'acquire' | 'transaction';

/** The pool could not serve this transaction in time. Retryable by definition. */
export class ServiceBusyError extends Error {
  readonly code = 'SERVICE_BUSY' as const;
  constructor(
    readonly phase: BusyPhase,
    readonly waitedMs: number,
  ) {
    super(
      phase === 'acquire'
        ? `No database connection within ${waitedMs} ms`
        : `The transaction did not finish within its deadline (${waitedMs} ms)`,
    );
    this.name = 'ServiceBusyError';
  }
}

/**
 * `db.transaction(fn)` bounded by `deadline`.
 *
 * The race alone would leave the work running behind the answer, so the
 * transaction watches the same clock from inside: a connection that arrives
 * after the caller gave up rolls back before doing anything, and work that
 * finishes after it rolls back instead of committing. «503» therefore always
 * means **nothing was written** — a device retrying after it never doubles a
 * row, and a portal action never half-happens.
 *
 * Statements already running are not cancelled; each one is bounded by the
 * role's `statement_timeout`.
 */
export function transactionWithDeadline<T>(
  db: Db,
  deadline: Deadline,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  const started = Date.now();
  const remaining = deadline.until - started;
  if (remaining <= 0) return Promise.reject(new ServiceBusyError('transaction', 0));

  let expired: ServiceBusyError | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let fail: (e: ServiceBusyError) => void = () => undefined;
  const arm = (ms: number, phase: BusyPhase) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      expired = new ServiceBusyError(phase, Date.now() - started);
      fail(expired);
    }, ms);
  };
  const shed = new Promise<never>((_, reject) => {
    fail = reject;
  });
  arm(Math.min(deadline.acquireMs, remaining), 'acquire');

  const work = db.transaction(async (tx) => {
    if (expired !== null) throw expired;
    arm(deadline.until - Date.now(), 'transaction');
    const out = await fn(tx);
    if (expired !== null) throw expired;
    return out;
  });
  // Whichever side loses the race must not surface as an unhandled rejection.
  work.catch(() => undefined);
  shed.catch(() => undefined);
  return Promise.race([work, shed]).finally(() => clearTimeout(timer));
}
