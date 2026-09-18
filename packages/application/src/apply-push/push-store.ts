/**
 * What `ApplyPushUseCase` needs from storage (B-08). The Postgres version is in
 * the portal; the tests use an in-memory one. The rules live in the use case,
 * so both see exactly the same decisions.
 *
 * A store is built for one caller — one business, one device, one open
 * transaction — so none of these take a tenant.
 */

import type { Delta, ReferencedTable } from '@xangarro/contracts';
import type { PushableTable, RejectedRow } from '@xangarro/contracts';

/** The serverSeq a row was accepted at, and the version accepted. */
export interface PushReceipt {
  readonly seq: number;
  /** ISO-8601, normalised: compared with the pushed row's `updatedAt`. */
  readonly rowUpdatedAt: string;
}

/**
 * - `written` — the row is stored as pushed.
 * - `stale` — an update older than what the cloud has; kept the cloud's.
 * - `exists` — a HYBRID insert for a row that is already there.
 */
export type WriteOutcome = 'written' | 'stale' | 'exists';

/** The id belongs to another business: invisible here, so the write was refused. */
export class ForeignRowError extends Error {
  readonly code = 'FOREIGN_ROW' as const;

  constructor(
    readonly table: string,
    readonly rowId: string,
  ) {
    super(`${table}/${rowId} belongs to another business`);
    this.name = 'ForeignRowError';
  }
}

export interface PushStore {
  receipt(table: PushableTable, rowId: string): Promise<PushReceipt | null>;
  exists(table: ReferencedTable, id: string): Promise<boolean>;
  /**
   * Runs `fn` so that a throw undoes only this row, never the batch. `fn` must
   * use the store it is given: in Postgres that one is bound to the savepoint,
   * and a failed statement issued outside it still aborts the whole batch.
   */
  isolated<T>(fn: (store: PushStore) => Promise<T>): Promise<T>;
  write(delta: Delta): Promise<WriteOutcome>;
  /** Give the row its seq, remember it, and — if devices pull it — log it. */
  accept(delta: Delta): Promise<number>;
  /** Keep a rejection so the portal can show it (ADR-053 Q4). */
  reject(delta: Delta, rejection: RejectedRow): Promise<void>;
  /** Record what this device may purge through, and return the tenant's cursor. */
  finish(acknowledgedThrough: number): Promise<number>;
}
