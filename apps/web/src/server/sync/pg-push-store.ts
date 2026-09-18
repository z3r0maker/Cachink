import 'server-only';

import type { PushReceipt, PushStore, WriteOutcome } from '@xangarro/application';
import {
  HYBRID_TABLES,
  type Delta,
  type PushableTable,
  type ReferencedTable,
  type RejectedRow,
} from '@xangarro/contracts';
import {
  allocateSeq,
  committedCursor,
  devices,
  logChange,
  SYNCED_TABLES,
  syncReceipts,
  syncRejections,
} from '@xangarro/data-pg';
import { newUlid } from '@xangarro/domain';
import { and, eq, sql } from 'drizzle-orm';

import type { Tx } from '../db';
import { rowFromWire, type Row } from './codec';
import { rejectionPayload } from './rejection-payload';
import { upsertRow } from './upsert-row';

/**
 * `PushStore` over Postgres, for one device inside one tenant transaction.
 * The rules are `ApplyPushUseCase`'s; this only stores what it decides.
 */
const HYBRID: ReadonlySet<string> = new Set(HYBRID_TABLES);
const iso = (v: string) => new Date(v).toISOString();

export class PgPushStore implements PushStore {
  constructor(
    private readonly tx: Tx,
    private readonly businessId: string,
    private readonly deviceId: string,
  ) {}

  async receipt(table: PushableTable, rowId: string): Promise<PushReceipt | null> {
    const [r] = await this.tx
      .select({ seq: syncReceipts.seq, at: syncReceipts.rowUpdatedAt })
      .from(syncReceipts)
      .where(and(eq(syncReceipts.tableName, table), eq(syncReceipts.rowId, rowId)));
    return r === undefined ? null : { seq: r.seq, rowUpdatedAt: iso(r.at) };
  }

  async exists(table: ReferencedTable, id: string): Promise<boolean> {
    const t = SYNCED_TABLES[table];
    const [r] = await this.tx.select({ id: t.id }).from(t).where(eq(t.id, id));
    return r !== undefined;
  }

  /**
   * A nested transaction is a SAVEPOINT, and the row runs on a store bound to
   * **it**. That matters: with postgres-js, a failed statement issued on the
   * outer handle aborts the whole transaction even inside a savepoint — the
   * first conformance run lost a whole batch to one bad row that way.
   */
  isolated<T>(fn: (store: PushStore) => Promise<T>): Promise<T> {
    return this.tx.transaction((sp) => fn(new PgPushStore(sp, this.businessId, this.deviceId)));
  }

  write(d: Delta): Promise<WriteOutcome> {
    const insertOnly = d.op === 'insert' && HYBRID.has(d.table);
    return upsertRow(this.tx, d.table, rowFromWire(d.row as Row), insertOnly);
  }

  async accept(d: Delta): Promise<number> {
    const { tx, businessId, deviceId } = this;
    const seq = HYBRID.has(d.table)
      ? await logChange(tx, businessId, d.table, d.rowId, d.op)
      : await allocateSeq(tx, businessId);
    const receivedAt = new Date().toISOString();
    const receipt = {
      seq,
      deviceId,
      rowUpdatedAt: String((d.row as Row)['updatedAt']),
      receivedAt,
    };
    await tx
      .insert(syncReceipts)
      .values({ ...receipt, businessId, tableName: d.table, rowId: d.rowId })
      .onConflictDoUpdate({
        target: [syncReceipts.businessId, syncReceipts.tableName, syncReceipts.rowId],
        set: receipt,
      });
    return seq;
  }

  /** A retry of the same row updates its rejection rather than adding one. */
  async reject(d: Delta, r: RejectedRow): Promise<void> {
    const { tx, businessId, deviceId } = this;
    const now = new Date().toISOString();
    const fields = {
      code: r.code,
      message: r.message,
      clientSeq: r.clientSeq,
      payload: sql`${rejectionPayload(d.table, d.row as Row)}::jsonb`,
      receivedAt: now,
      resolvedAt: null,
      updatedAt: now,
    };
    const key = { businessId, deviceId, tableName: d.table, rowId: d.rowId };
    await tx
      .insert(syncRejections)
      .values({ ...fields, ...key, id: newUlid(), createdAt: now })
      .onConflictDoUpdate({
        target: [
          syncRejections.businessId,
          syncRejections.deviceId,
          syncRejections.tableName,
          syncRejections.rowId,
        ],
        set: fields,
      });
  }

  async finish(acknowledgedThrough: number): Promise<number> {
    await this.tx
      .update(devices)
      .set({
        acknowledgedThrough: sql`GREATEST(${devices.acknowledgedThrough}, ${acknowledgedThrough})`,
        lastPushAt: new Date().toISOString(),
      })
      .where(eq(devices.id, this.deviceId));
    // Informational: the tenant's cursor at commit. A phone takes its pull
    // cursor from pull responses only — UP rows are not in the pull stream.
    return committedCursor(this.tx);
  }
}
