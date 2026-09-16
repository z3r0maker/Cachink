/**
 * Per-row cloud outcome (`__sync_row_status`, migration 0001).
 *
 * A row is `pending` while in flight, `accepted` once the server stores it
 * (with its serverSeq), or `rejected` with the server's code. Rejected rows
 * are never dropped (Q4): retryable ones come back through `dueRetries`
 * after exponential backoff; non-retryable ones wait for a manual retry.
 */

import { and, count, eq, lte, sql } from 'drizzle-orm';
import type { CachinkDatabase } from '@xangarro/data';
import { syncRowStatus } from '@xangarro/data';
import type { CoalescedChange } from './outbox-reader.js';

const BASE_BACKOFF_MS = 60_000;
const MAX_BACKOFF_MS = 2 * 60 * 60_000;

/** 1 min, 2 min, 4 min … capped at 2 h. */
export function backoffMs(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}

export interface Rejection {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

export class StatusStore {
  readonly #db: CachinkDatabase;
  constructor(db: CachinkDatabase) {
    this.#db = db;
  }

  async markPending(changes: readonly CoalescedChange[], nowIso: string): Promise<void> {
    for (const c of changes) {
      await this.#db
        .insert(syncRowStatus)
        .values({
          tableName: c.tableName,
          rowId: c.rowId,
          status: 'pending',
          lastAttemptAt: nowIso,
        })
        .onConflictDoUpdate({
          target: [syncRowStatus.tableName, syncRowStatus.rowId],
          set: { status: 'pending', lastAttemptAt: nowIso },
        })
        .run();
    }
  }

  async markAccepted(tableName: string, rowId: string, serverSeq: number): Promise<void> {
    await this.#db
      .update(syncRowStatus)
      .set({
        status: 'accepted',
        serverSeq,
        code: null,
        message: null,
        retryable: false,
        retryAfter: null,
      })
      .where(and(eq(syncRowStatus.tableName, tableName), eq(syncRowStatus.rowId, rowId)))
      .run();
  }

  async markRejected(tableName: string, rowId: string, r: Rejection, now: Date): Promise<void> {
    await this.#db
      .insert(syncRowStatus)
      .values({
        tableName,
        rowId,
        status: 'rejected',
        code: r.code,
        message: r.message,
        retryable: r.retryable,
        attempts: 1,
      })
      .onConflictDoUpdate({
        target: [syncRowStatus.tableName, syncRowStatus.rowId],
        set: {
          status: 'rejected',
          code: r.code,
          message: r.message,
          retryable: r.retryable,
          attempts: sql`${syncRowStatus.attempts} + 1`,
        },
      })
      .run();
    const row = await this.#db
      .select({ attempts: syncRowStatus.attempts })
      .from(syncRowStatus)
      .where(and(eq(syncRowStatus.tableName, tableName), eq(syncRowStatus.rowId, rowId)))
      .get();
    const retryAfter = r.retryable
      ? new Date(now.getTime() + backoffMs(row?.attempts ?? 1)).toISOString()
      : null;
    await this.#db
      .update(syncRowStatus)
      .set({ retryAfter })
      .where(and(eq(syncRowStatus.tableName, tableName), eq(syncRowStatus.rowId, rowId)))
      .run();
  }

  /** Retryable rejections whose backoff elapsed. Retried as inserts: the server never stored them. */
  async dueRetries(now: Date, limit: number): Promise<readonly CoalescedChange[]> {
    const rows = await this.#db
      .select({ tableName: syncRowStatus.tableName, rowId: syncRowStatus.rowId })
      .from(syncRowStatus)
      .where(
        and(
          eq(syncRowStatus.status, 'rejected'),
          eq(syncRowStatus.retryable, true),
          lte(syncRowStatus.retryAfter, now.toISOString()),
        ),
      )
      .limit(limit)
      .all();
    return rows.map((r) => ({ tableName: r.tableName, rowId: r.rowId, op: 'insert' as const }));
  }

  /** Manual retry from "No enviados" (A-08): makes a rejected row due now. */
  async requeue(tableName: string, rowId: string, now: Date): Promise<void> {
    await this.#db
      .update(syncRowStatus)
      .set({ retryable: true, retryAfter: now.toISOString() })
      .where(and(eq(syncRowStatus.tableName, tableName), eq(syncRowStatus.rowId, rowId)))
      .run();
  }

  async countByStatus(): Promise<{ pending: number; rejected: number; retrying: number }> {
    const rows = await this.#db
      .select({ status: syncRowStatus.status, retryable: syncRowStatus.retryable, n: count() })
      .from(syncRowStatus)
      .groupBy(syncRowStatus.status, syncRowStatus.retryable)
      .all();
    const pick = (s: string, retryable?: boolean): number =>
      rows
        .filter((r) => r.status === s && (retryable === undefined || r.retryable === retryable))
        .reduce((a, r) => a + r.n, 0);
    return {
      pending: pick('pending'),
      rejected: pick('rejected', false),
      retrying: pick('rejected', true),
    };
  }
}
