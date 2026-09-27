import 'server-only';

import {
  rowKey,
  storableString,
  type PushReceipt,
  type PushStore,
  type Rejection,
  type RejectOptions,
  type RowKey,
  type WriteOutcome,
} from '@xangarro/application';
import {
  HYBRID_TABLES,
  type Delta,
  type PushableTable,
  type ReferencedTable,
} from '@xangarro/contracts';
import {
  allocateSeqs,
  existingIds,
  finishPush,
  logChanges,
  receiptsOf,
  resolveRejections,
  saveReceipts,
  saveRejections,
  writeSyncedRows,
  type RowWrite,
} from '@xangarro/data-pg';

import type { Tx } from '../db';
import { rowFromWire, type Row } from './codec';
import { rejectionPayload } from './rejection-payload';
import { storeError } from './store-error';

/**
 * `PushStore` over Postgres, for one device inside one tenant transaction.
 * The rules are `ApplyPushUseCase`'s; this only stores what it decides, a
 * batch per statement (ADR-115).
 */
const HYBRID: ReadonlySet<string> = new Set(HYBRID_TABLES);

const OUTCOME: Record<RowWrite, (insertOnly: boolean) => WriteOutcome> = {
  written: () => 'written',
  kept: (insertOnly) => (insertOnly ? 'exists' : 'stale'),
  invisible: () => 'foreign',
};

export class PgPushStore implements PushStore {
  constructor(
    private readonly tx: Tx,
    private readonly businessId: string,
    private readonly deviceId: string,
  ) {}

  async receipts(keys: readonly RowKey[]): Promise<ReadonlyMap<string, PushReceipt>> {
    const rows = await receiptsOf(this.tx, this.businessId, keys);
    return new Map(rows.map((r) => [rowKey(r.tableName, r.rowId), r]));
  }

  existing(table: ReferencedTable, ids: readonly string[]): Promise<ReadonlySet<string>> {
    return existingIds(this.tx, table, ids);
  }

  /**
   * A nested transaction is a SAVEPOINT, and the write runs on a store bound to
   * **it**. That matters: with postgres-js, a failed statement issued on the
   * outer handle aborts the whole transaction even inside a savepoint — the
   * first conformance run lost a whole batch to one bad row that way.
   */
  isolated<T>(fn: (store: PushStore) => Promise<T>): Promise<T> {
    return this.tx.transaction((sp) => fn(new PgPushStore(sp, this.businessId, this.deviceId)));
  }

  async write(table: PushableTable, deltas: readonly Delta[]): Promise<readonly WriteOutcome[]> {
    const insertOnly = HYBRID.has(table);
    const rows = deltas.map((d) => rowFromWire(d.row as Row));
    try {
      const written = await writeSyncedRows(this.tx, table, rows, insertOnly);
      return written.map((w) => OUTCOME[w](insertOnly));
    } catch (error) {
      throw storeError(error, table, deltas);
    }
  }

  /**
   * One cursor bump for the batch, then its log entries, its receipts and the
   * closing of these rows' open rejections (DB3-SYNC-04) together: postgres.js
   * pipelines the three statements, so accepting 500 rows is two round trips,
   * with the tenant's cursor lock held from the first to commit.
   */
  async accept(deltas: readonly Delta[]): Promise<readonly number[]> {
    const { tx, businessId, deviceId } = this;
    if (deltas.length === 0) return [];
    const first = await allocateSeqs(tx, businessId, deltas.length);
    const seqs = deltas.map((_, i) => first + i);
    const entries = deltas.map((d, i) => ({ d, seq: seqs[i] as number }));
    await Promise.all([
      logChanges(
        tx,
        businessId,
        entries
          .filter(({ d }) => HYBRID.has(d.table))
          .map(({ d, seq }) => ({ seq, tableName: d.table, rowId: d.rowId, op: d.op })),
      ),
      saveReceipts(
        tx,
        businessId,
        deviceId,
        entries.map(({ d, seq }) => ({
          seq,
          tableName: d.table,
          rowId: d.rowId,
          rowUpdatedAt: String((d.row as Row)['updatedAt']),
        })),
      ),
      resolveRejections(
        tx,
        businessId,
        deviceId,
        deltas.map((d) => ({ table: d.table, rowId: d.rowId })),
      ),
    ]);
    return seqs;
  }

  /**
   * Text columns refuse a NUL, so the id and the message are cleaned too: the
   * use case keeps rejections in a savepoint, then `withoutPayload`, and a
   * failure here must not be the row's own id (DB3-SYNC-01).
   */
  reject(rejections: readonly Rejection[], options: RejectOptions = {}): Promise<void> {
    return saveRejections(
      this.tx,
      this.businessId,
      this.deviceId,
      rejections.map(({ delta: d, rejection: r }) => ({
        tableName: d.table,
        rowId: storableString(d.rowId),
        clientSeq: r.clientSeq,
        code: r.code,
        message: storableString(r.message),
        payload: options.withoutPayload === true ? null : rejectionPayload(d.table, d.row as Row),
      })),
    );
  }

  /**
   * Informational: the tenant's cursor at commit. A phone takes its pull
   * cursor from pull responses only — UP rows are not in the pull stream.
   */
  finish(acknowledgedThrough: number): Promise<number> {
    return finishPush(this.tx, this.deviceId, acknowledgedThrough);
  }
}
