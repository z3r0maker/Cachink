import type { Delta, PushableTable, ReferencedTable, RejectedRow } from '@xangarro/contracts';

import {
  ForeignRowError,
  type PushReceipt,
  type PushStore,
  type WriteOutcome,
} from '../../src/apply-push/push-store.js';

type Row = Record<string, unknown>;
const key = (table: string, id: string) => `${table}/${id}`;

/**
 * The store's contract in memory, including the parts that are easy to get
 * wrong: `isolated` rolls back a failed row's writes, and ids owned by another
 * business throw `ForeignRowError` rather than being visible.
 */
export class InMemoryPushStore implements PushStore {
  rows = new Map<string, Row>();
  foreign = new Set<string>();
  receipts = new Map<string, PushReceipt>();
  rejections: RejectedRow[] = [];
  logged: string[] = [];
  seq = 0;
  acknowledged = 0;
  writes = 0;
  failOn: string | null = null;

  seed(table: string, row: Row): void {
    this.rows.set(key(table, String(row['id'])), row);
  }

  async receipt(table: PushableTable, rowId: string) {
    return this.receipts.get(key(table, rowId)) ?? null;
  }

  async exists(table: ReferencedTable, id: string) {
    return this.rows.has(key(table, id));
  }

  /**
   * Like Postgres, writes only count through the store `isolated` hands out:
   * the root store refuses them, so a use case that writes on the outer store
   * — which in Postgres aborts the batch — fails here too.
   */
  async isolated<T>(fn: (store: PushStore) => Promise<T>): Promise<T> {
    const snapshot = { rows: new Map(this.rows), receipts: new Map(this.receipts), seq: this.seq };
    const inner: PushStore = Object.assign(Object.create(null) as PushStore, {
      receipt: this.receipt.bind(this),
      exists: this.exists.bind(this),
      isolated: this.isolated.bind(this),
      write: (d: Delta) => this.writeRow(d),
      accept: (d: Delta) => this.acceptRow(d),
      reject: this.reject.bind(this),
      finish: this.finish.bind(this),
    });
    try {
      return await fn(inner);
    } catch (e) {
      Object.assign(this, snapshot);
      throw e;
    }
  }

  async write(_d: Delta): Promise<WriteOutcome> {
    throw new Error('write outside isolated(): would abort the whole batch');
  }

  async accept(_d: Delta): Promise<number> {
    throw new Error('accept outside isolated(): would abort the whole batch');
  }

  private async writeRow(d: Delta): Promise<WriteOutcome> {
    const k = key(d.table, d.rowId);
    if (this.failOn === d.rowId) throw new Error('disk on fire');
    if (this.foreign.has(k)) throw new ForeignRowError(d.table, d.rowId);
    const row = d.row as Row;
    const current = this.rows.get(k);
    if (current !== undefined && d.op === 'insert' && d.table === 'products') return 'exists';
    if (current !== undefined && String(current['updatedAt']) > String(row['updatedAt'])) {
      return 'stale';
    }
    this.writes += 1;
    this.rows.set(k, row);
    return 'written';
  }

  private async acceptRow(d: Delta) {
    this.seq += 1;
    const updatedAt = String((d.row as Row)['updatedAt']);
    this.receipts.set(key(d.table, d.rowId), { seq: this.seq, rowUpdatedAt: updatedAt });
    if (d.table === 'products' || d.table === 'clients') this.logged.push(key(d.table, d.rowId));
    return this.seq;
  }

  async reject(_d: Delta, rejection: RejectedRow) {
    this.rejections.push(rejection);
  }

  async finish(acknowledgedThrough: number) {
    this.acknowledged = Math.max(this.acknowledged, acknowledgedThrough);
    return this.seq;
  }
}
