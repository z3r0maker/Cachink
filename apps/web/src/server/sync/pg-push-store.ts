import 'server-only';

import {
  pushAnomalies,
  rowKey,
  storableString,
  type PushAnomaly,
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
import { logPushAnomalies, type AnomalyLogger } from './anomaly-log';
import { rowFromWire, type Row } from './codec';
import { rejectionPayload } from './rejection-payload';
import { storeError } from './store-error';

/**
 * `PushStore` over Postgres, for one device inside one tenant transaction.
 * The rules are `ApplyPushUseCase`'s; this only stores what it decides, a
 * batch per statement (ADR-120).
 */
const HYBRID: ReadonlySet<string> = new Set(HYBRID_TABLES);

const OUTCOME: Record<RowWrite, (insertOnly: boolean) => WriteOutcome> = {
  written: () => 'written',
  kept: (insertOnly) => (insertOnly ? 'exists' : 'stale'),
  invisible: () => 'foreign',
};

export interface PushStoreOptions {
  /** The server's clock, which pushed rows' own timestamps are held to (F-05 a). */
  readonly now?: () => Date;
  /** Where a push's anomalies go (F-05 c). Default: one structured log line. */
  readonly logAnomalies?: AnomalyLogger;
}

/** What one push's stores share — the root and every savepoint's. */
interface PushState {
  readonly anomalies: PushAnomaly[];
  /** Epoch ms of the last write's clock. */
  lastWrite: number;
}

export class PgPushStore implements PushStore {
  private push: PushState = { anomalies: [], lastWrite: 0 };

  constructor(
    private readonly tx: Tx,
    private readonly businessId: string,
    private readonly deviceId: string,
    private readonly options: PushStoreOptions = {},
  ) {}

  /**
   * The server's time for a write, **strictly later than this push's last
   * one**. Two versions of one row in a push (a turno opened, then closed) are
   * two writes; from a phone whose clock is in the future both are stored at
   * the server's time, and at the same instant the second would lose to the
   * first.
   */
  private writeClock(): Date {
    const now = (this.options.now ?? (() => new Date()))().getTime();
    this.push.lastWrite = Math.max(now, this.push.lastWrite + 1);
    return new Date(this.push.lastWrite);
  }

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
    return this.tx.transaction((sp) => {
      const inner = new PgPushStore(sp, this.businessId, this.deviceId, this.options);
      inner.push = this.push;
      return fn(inner);
    });
  }

  async write(table: PushableTable, deltas: readonly Delta[]): Promise<readonly WriteOutcome[]> {
    const insertOnly = HYBRID.has(table);
    const rows = deltas.map((d) => rowFromWire(d.row as Row));
    try {
      const now = this.writeClock();
      const written = await writeSyncedRows(this.tx, table, rows, insertOnly, { now });
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
   *
   * What these rows carry that an honest device would not is noted here — for
   * rows accepted now, so a retry answered from its receipt is not noted twice
   * — and logged once, in `finish`. They are stored all the same (F-05 c).
   */
  async accept(deltas: readonly Delta[]): Promise<readonly number[]> {
    const { tx, businessId, deviceId } = this;
    if (deltas.length === 0) return [];
    this.push.anomalies.push(...pushAnomalies(deltas, deviceId));
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
    const { businessId, deviceId } = this;
    const { anomalies } = this.push;
    if (anomalies.length > 0) {
      (this.options.logAnomalies ?? logPushAnomalies)({ businessId, deviceId }, anomalies);
    }
    return finishPush(this.tx, deviceId, acknowledgedThrough);
  }
}
