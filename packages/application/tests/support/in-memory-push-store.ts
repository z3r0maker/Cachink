import {
  HYBRID_TABLES,
  type Delta,
  type PushableTable,
  type ReferencedTable,
} from '@xangarro/contracts';

import {
  ForeignRowError,
  RowRefusedError,
  rowKey as key,
  TransientWriteError,
  type PushReceipt,
  type PushStore,
  type Rejection,
  type RejectOptions,
  type RowKey,
  type WriteOutcome,
} from '../../src/apply-push/push-store.js';

type Row = Record<string, unknown>;
const HYBRID: ReadonlySet<string> = new Set(HYBRID_TABLES);

/**
 * The store's contract in memory, including the parts that are easy to get
 * wrong: a write is one statement for the whole batch — all rows or none, like
 * Postgres — `isolated` rolls back a failed write, and ids owned by another
 * business fail an upsert outright (RLS 42501) or come back `foreign` on a
 * HYBRID insert. `calls` counts round trips, so tests can hold the batching.
 */
export class InMemoryPushStore implements PushStore {
  rows = new Map<string, Row>();
  foreign = new Set<string>();
  receiptsByKey = new Map<string, PushReceipt>();
  rejections: Rejection[] = [];
  logged: string[] = [];
  seq = 0;
  acknowledged = 0;
  writes = 0;
  /** Row ids whose presence makes a write fail, as a bad row fails a statement. */
  failOn = new Set<string>();
  /** Row ids whose presence makes a write time out. */
  transientOn = new Set<string>();
  /** Row ids the database refuses for good: bad values, or a unique key taken. */
  refuseOn = new Map<string, 'invalid' | 'duplicate'>();
  /** How many `reject` calls throw before one succeeds, as a payload Postgres refuses. */
  failReject = 0;
  /** How each successful `reject` kept its rows: with the payload, or `bare`. */
  rejectModes: ('full' | 'bare')[] = [];
  /** Keys whose open rejection an `accept` resolved. */
  resolved: string[] = [];
  /** Runs once, just before the first write: a concurrent push committing first. */
  racing: (() => void) | null = null;
  /** Savepoints that wrote and stayed — Postgres caches 64 per transaction. */
  isolatedCommits = 0;
  calls = { receipts: 0, existing: 0, write: 0, accept: 0, reject: 0, finish: 0 };

  seed(table: string, row: Row): void {
    this.rows.set(key(table, String(row['id'])), row);
  }

  async receipts(keys: readonly RowKey[]) {
    this.calls.receipts += 1;
    const found = new Map<string, PushReceipt>();
    for (const k of keys) {
      const r = this.receiptsByKey.get(key(k.table, k.rowId));
      if (r !== undefined) found.set(key(k.table, k.rowId), r);
    }
    return found;
  }

  async existing(table: ReferencedTable, ids: readonly string[]) {
    this.calls.existing += 1;
    return new Set(ids.filter((id) => this.rows.has(key(table, id))));
  }

  /**
   * Like Postgres, writes only count through the store `isolated` hands out:
   * the root store refuses them, so a use case that writes on the outer store
   * — which in Postgres aborts the batch — fails here too.
   */
  async isolated<T>(fn: (store: PushStore) => Promise<T>): Promise<T> {
    const snapshot = { rows: new Map(this.rows), writes: this.writes };
    const inner: PushStore = Object.assign(Object.create(null) as PushStore, {
      receipts: this.receipts.bind(this),
      existing: this.existing.bind(this),
      isolated: this.isolated.bind(this),
      write: (table: PushableTable, deltas: readonly Delta[]) => this.writeRows(table, deltas),
      accept: this.accept.bind(this),
      reject: this.reject.bind(this),
      finish: this.finish.bind(this),
    });
    try {
      const result = await fn(inner);
      this.isolatedCommits += 1;
      return result;
    } catch (e) {
      Object.assign(this, snapshot);
      throw e;
    }
  }

  async write(_table: PushableTable, _deltas: readonly Delta[]): Promise<WriteOutcome[]> {
    throw new Error('write outside isolated(): would abort the whole batch');
  }

  private async writeRows(table: PushableTable, deltas: readonly Delta[]) {
    this.calls.write += 1;
    const race = this.racing;
    this.racing = null;
    race?.();
    const ids = deltas.map((d) => d.rowId);
    if (ids.some((id) => this.transientOn.has(id))) {
      throw new TransientWriteError(new Error('statement timeout'));
    }
    if (ids.some((id) => this.failOn.has(id))) throw new Error('disk on fire');
    const refused = ids.map((id) => this.refuseOn.get(id)).find((r) => r !== undefined);
    if (refused !== undefined) throw new RowRefusedError(refused, new Error('22021 / 23505'));
    const insertOnly = HYBRID.has(table);
    const foreign = ids.find((id) => this.foreign.has(key(table, id)));
    if (!insertOnly && foreign !== undefined) throw new ForeignRowError(table, foreign);
    return deltas.map((d) => this.writeRow(d, insertOnly));
  }

  private writeRow(d: Delta, insertOnly: boolean): WriteOutcome {
    const k = key(d.table, d.rowId);
    if (this.foreign.has(k)) return 'foreign';
    const row = d.row as Row;
    const current = this.rows.get(k);
    if (current !== undefined && insertOnly) return 'exists';
    if (current !== undefined && String(current['updatedAt']) > String(row['updatedAt'])) {
      return 'stale';
    }
    this.writes += 1;
    this.rows.set(k, row);
    return 'written';
  }

  async accept(deltas: readonly Delta[]) {
    this.calls.accept += 1;
    return deltas.map((d) => {
      this.seq += 1;
      const updatedAt = String((d.row as Row)['updatedAt']);
      this.receiptsByKey.set(key(d.table, d.rowId), { seq: this.seq, rowUpdatedAt: updatedAt });
      if (HYBRID.has(d.table)) this.logged.push(key(d.table, d.rowId));
      this.resolved.push(key(d.table, d.rowId));
      return this.seq;
    });
  }

  async reject(rejections: readonly Rejection[], options: RejectOptions = {}) {
    this.calls.reject += 1;
    if (this.failReject > 0) {
      this.failReject -= 1;
      throw new Error('22P05: unsupported Unicode escape sequence');
    }
    this.rejectModes.push(options.withoutPayload === true ? 'bare' : 'full');
    this.rejections.push(...rejections);
  }

  async finish(acknowledgedThrough: number) {
    this.calls.finish += 1;
    this.acknowledged = Math.max(this.acknowledged, acknowledgedThrough);
    return this.seq;
  }
}
