/**
 * Writes a push's rows one statement per table, and keeps one bad row from
 * failing the rest (B-08; audit DB2-SYNC-01/-02; ADR-118).
 *
 * The happy path is one isolated write per table. When that write fails, the
 * rows are split in half and each half tried again, down to the single row that
 * fails — a handful of extra statements for one bad row in 500, instead of 500
 * savepoints for every push. That row's answer is terminal when the database
 * refused it for good (`RowRefusedError`, DB3-SYNC-01 c), retryable otherwise.
 *
 * **The savepoint budget.** Postgres caches 64 open subtransactions per
 * transaction; past that, every snapshot in the cluster reads `pg_subtrans`
 * (DB2-SYNC-02). A savepoint that wrote keeps its slot until commit, so the
 * writer keeps at most `MAX_KEPT_SAVEPOINTS` of them; rows still unresolved when
 * the budget runs out are answered retryable, and the phone sends them again.
 * A failed attempt is rolled back, which frees its slot, so it is not counted.
 */

import type { PushableTable } from '@xangarro/contracts';

import type { Item } from './push-plan.js';
import {
  ForeignRowError,
  RowRefusedError,
  TransientWriteError,
  type PushStore,
  type WriteOutcome,
} from './push-store.js';

/**
 * What a row's write came to: a store outcome, `internal` — retry later — or
 * refused for good: `invalid` values, or a `duplicate` of another row's unique key.
 */
export type WriteResult = WriteOutcome | 'internal' | RowRefusedError['reason'];

export const MAX_KEPT_SAVEPOINTS = 60;

export class PushWriter {
  private kept = 0;
  private reportedBudget = false;

  constructor(
    private readonly store: PushStore,
    private readonly logError: (error: unknown) => void,
  ) {}

  /** Write rows of one table; every item gets a result. */
  async write(
    table: PushableTable,
    items: readonly Item[],
    out: Map<number, WriteResult>,
  ): Promise<void> {
    if (items.length === 0) return;
    if (this.kept >= MAX_KEPT_SAVEPOINTS) return this.outOfBudget(items, out);
    try {
      const deltas = items.map((i) => i.delta);
      const outcomes = await this.store.isolated((s) => s.write(table, deltas));
      this.kept += 1;
      items.forEach((item, j) => out.set(item.index, outcomes[j] ?? 'internal'));
    } catch (error) {
      await this.failed(table, items, error, out);
    }
  }

  private async failed(
    table: PushableTable,
    items: readonly Item[],
    error: unknown,
    out: Map<number, WriteResult>,
  ): Promise<void> {
    const [only] = items;
    if (only !== undefined && items.length === 1 && error instanceof ForeignRowError) {
      out.set(only.index, 'foreign');
      return;
    }
    if (only !== undefined && items.length === 1 && error instanceof RowRefusedError) {
      this.logError(error);
      out.set(only.index, error.reason);
      return;
    }
    if (items.length === 1 || error instanceof TransientWriteError) {
      this.logError(error);
      for (const item of items) out.set(item.index, 'internal');
      return;
    }
    const half = Math.ceil(items.length / 2);
    await this.write(table, items.slice(0, half), out);
    await this.write(table, items.slice(half), out);
  }

  private outOfBudget(items: readonly Item[], out: Map<number, WriteResult>): void {
    if (!this.reportedBudget) {
      this.reportedBudget = true;
      this.logError(new Error(`push: savepoint budget (${MAX_KEPT_SAVEPOINTS}) spent`));
    }
    for (const item of items) out.set(item.index, 'internal');
  }
}
