/**
 * What `ApplyPushUseCase` needs from storage (B-08). The Postgres version is in
 * the portal; the tests use an in-memory one. The rules live in the use case,
 * so both see exactly the same decisions.
 *
 * A store is built for one caller — one business, one device, one open
 * transaction — so none of these take a tenant.
 *
 * **Every method takes a batch** (audit DB2-SYNC-01, ADR-119). One push costs a
 * number of statements set by how many tables it touches, not by how many rows
 * it carries: a 500-row push used to be ~4,200 round trips inside the tenant's
 * cursor lock.
 */

import type { Delta, PushableTable, ReferencedTable, RejectedRow } from '@xangarro/contracts';

/** The serverSeq a row was accepted at, and the version accepted. */
export interface PushReceipt {
  readonly seq: number;
  /** ISO-8601, normalised: compared with the pushed row's `updatedAt`. */
  readonly rowUpdatedAt: string;
}

/** A pushed row's identity: its table and its id. */
export interface RowKey {
  readonly table: PushableTable;
  readonly rowId: string;
}

/** The one spelling of a `RowKey` as a map key, for both sides of the port. */
export const rowKey = (table: string, rowId: string): string => `${table}/${rowId}`;

/**
 * - `written` — the row is stored as pushed.
 * - `stale` — an update older than what the cloud has; kept the cloud's.
 * - `exists` — a HYBRID insert for a row that is already there.
 * - `foreign` — the id is taken by another business: invisible here, not written.
 */
export type WriteOutcome = 'written' | 'stale' | 'exists' | 'foreign';

/**
 * The id belongs to another business, and the database refused the statement
 * for it (RLS 42501 on an upsert). In a batch, the store cannot tell which row
 * it was; the use case narrows it down.
 */
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

/**
 * The database refused a write for a reason that is about the moment, not about
 * any row — a timeout, a lock, a deadlock. Splitting the batch would only repeat
 * it, so the use case answers every row of that write as retryable instead.
 */
export class TransientWriteError extends Error {
  readonly code = 'TRANSIENT_WRITE' as const;

  constructor(cause: unknown) {
    super('transient write failure', { cause });
    this.name = 'TransientWriteError';
  }
}

/**
 * The database refused a row for good (audit DB3-SYNC-01 c): a value it cannot
 * take (`invalid` — class 22, a NOT NULL or CHECK), or a unique key another row
 * already holds (`duplicate`). Sending it again changes nothing, so the row is
 * answered terminally. In a batch the store cannot tell which row it was; the
 * use case narrows it down.
 */
export class RowRefusedError extends Error {
  readonly code = 'ROW_REFUSED' as const;

  constructor(
    readonly reason: 'invalid' | 'duplicate',
    cause: unknown,
  ) {
    super(`row refused: ${reason}`, { cause });
    this.name = 'RowRefusedError';
  }
}

/** A rejection to keep, with the delta it answers. */
export interface Rejection {
  readonly delta: Delta;
  readonly rejection: RejectedRow;
}

export interface RejectOptions {
  /** Keep the answer, not the row it answers — for a row the payload column refuses. */
  readonly withoutPayload?: boolean;
}

export interface PushStore {
  /** The receipts these rows have, by `rowKey`. One lookup for the batch. */
  receipts(keys: readonly RowKey[]): Promise<ReadonlyMap<string, PushReceipt>>;
  /** Which of `ids` exist in this business. One lookup per table. */
  existing(table: ReferencedTable, ids: readonly string[]): Promise<ReadonlySet<string>>;
  /**
   * Runs `fn` so that a throw undoes only what `fn` wrote, never the batch.
   * `fn` must use the store it is given: in Postgres that one is bound to the
   * savepoint, and a failed statement issued outside it aborts the whole push.
   */
  isolated<T>(fn: (store: PushStore) => Promise<T>): Promise<T>;
  /**
   * Store rows of **one** table, all or none: one outcome per delta, in order.
   * Throws `ForeignRowError` when another business's id made the database
   * refuse the statement, `TransientWriteError` for a timeout or lock, and
   * anything else as it came.
   */
  write(table: PushableTable, deltas: readonly Delta[]): Promise<readonly WriteOutcome[]>;
  /**
   * Give each row its seq — consecutive, in the order given — remember them,
   * log the rows devices pull, and resolve this device's open rejections of
   * these rows (DB3-SYNC-04). One cursor bump for the whole call.
   */
  accept(deltas: readonly Delta[]): Promise<readonly number[]>;
  /**
   * Keep rejections so the portal can show them (ADR-053 Q4). The use case runs
   * it through `isolated`, and again `withoutPayload` if that fails: bookkeeping
   * never fails a push (DB3-SYNC-01).
   */
  reject(rejections: readonly Rejection[], options?: RejectOptions): Promise<void>;
  /** Record what this device may purge through, and return the tenant's cursor. */
  finish(acknowledgedThrough: number): Promise<number>;
}
