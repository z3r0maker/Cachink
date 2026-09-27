/**
 * Per-row cloud outcome (`__sync_row_status`, migration 0001).
 *
 * A row is `pending` while in flight, `accepted` once the server stores it
 * (with its serverSeq), or `rejected` with the server's code. Rejected rows
 * are never dropped (Q4): retryable ones come back through `dueRetries`
 * after exponential backoff with equal jitter; non-retryable ones wait for a
 * manual retry. A row can never stay `pending` for good (DB2-DEV-01): a
 * batch that fails as a whole puts its retries back (`restoreRetries`), and
 * a row pending longer than `STALE_PENDING_MS` — its push never answered:
 * a crash, a closed tab — is due again.
 */

import { and, count, desc, eq, lte, or, sql } from 'drizzle-orm';
import type { XangarroDatabase } from '@xangarro/data';
import { syncRowStatus } from '@xangarro/data';
import { equalJitter, type Random } from './backoff.js';
import type { CoalescedChange } from './outbox-reader.js';
import { unsentRows } from './unsent.js';

const BASE_BACKOFF_MS = 60_000;
/** Far beyond any request timeout: a row pending this long is not in flight. */
export const STALE_PENDING_MS = 10 * 60_000;
const MAX_BACKOFF_MS = 2 * 60 * 60_000;

/** 1 min, 2 min, 4 min … capped at 2 h — the latest a retry is scheduled (jitter only brings it forward). */
export function backoffMs(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}

export interface Rejection {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

/** A row the server refused, as "No enviados" (A-08) shows it. */
export interface RejectedEntry {
  readonly tableName: string;
  readonly rowId: string;
  readonly code: string;
  readonly message: string;
  /** True while automatic retries are still scheduled. */
  readonly retryable: boolean;
  readonly attempts: number;
  readonly lastAttemptAt: string | null;
}

export interface StatusStoreOptions {
  /** Injected for tests; spreads row retries so devices don't retry in step. */
  readonly random?: Random;
}

const byRow = (tableName: string, rowId: string) =>
  and(eq(syncRowStatus.tableName, tableName), eq(syncRowStatus.rowId, rowId));

export class StatusStore {
  readonly #db: XangarroDatabase;
  readonly #random: Random;
  constructor(db: XangarroDatabase, opts: StatusStoreOptions = {}) {
    this.#db = db;
    this.#random = opts.random ?? Math.random;
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
      .where(byRow(tableName, rowId))
      .run();
  }

  async markRejected(tableName: string, rowId: string, r: Rejection, now: Date): Promise<void> {
    const row = await this.#db
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
      .returning({ attempts: syncRowStatus.attempts })
      .get();
    await this.#schedule(tableName, rowId, r.retryable ? (row?.attempts ?? 1) : null, now);
  }

  /**
   * The batch carrying these retries failed as a whole (offline, 5xx, 429,
   * timeout): back to `rejected`, one more attempt counted, next backoff.
   */
  async restoreRetries(changes: readonly CoalescedChange[], now: Date): Promise<void> {
    for (const c of changes) {
      const row = await this.#db
        .update(syncRowStatus)
        .set({ status: 'rejected', retryable: true, attempts: sql`${syncRowStatus.attempts} + 1` })
        .where(byRow(c.tableName, c.rowId))
        .returning({ attempts: syncRowStatus.attempts })
        .get();
      if (row) await this.#schedule(c.tableName, c.rowId, row.attempts, now);
    }
  }

  /** `retryAfter` for the given attempt number, or none (`null` = wait for a person). */
  async #schedule(tableName: string, rowId: string, attempts: number | null, now: Date) {
    const retryAfter =
      attempts === null
        ? null
        : new Date(now.getTime() + equalJitter(backoffMs(attempts), this.#random)).toISOString();
    await this.#db.update(syncRowStatus).set({ retryAfter }).where(byRow(tableName, rowId)).run();
  }

  /**
   * Retryable rejections whose backoff elapsed, plus rows stranded `pending`.
   * Retried as inserts: the server either never stored them or answers an
   * already-stored row from its receipt (idempotent on id + updatedAt).
   */
  async dueRetries(now: Date, limit: number): Promise<readonly CoalescedChange[]> {
    const staleBefore = new Date(now.getTime() - STALE_PENDING_MS).toISOString();
    const rows = await this.#db
      .select({ tableName: syncRowStatus.tableName, rowId: syncRowStatus.rowId })
      .from(syncRowStatus)
      .where(
        or(
          and(
            eq(syncRowStatus.status, 'rejected'),
            eq(syncRowStatus.retryable, true),
            lte(syncRowStatus.retryAfter, now.toISOString()),
          ),
          and(eq(syncRowStatus.status, 'pending'), lte(syncRowStatus.lastAttemptAt, staleBefore)),
        ),
      )
      .limit(limit)
      .all();
    return rows.map((r) => ({ tableName: r.tableName, rowId: r.rowId, op: 'insert' as const }));
  }

  /** Rejected rows, most recent attempt first. */
  async listRejected(limit: number): Promise<readonly RejectedEntry[]> {
    const rows = await this.#db
      .select()
      .from(syncRowStatus)
      .where(eq(syncRowStatus.status, 'rejected'))
      .orderBy(desc(syncRowStatus.lastAttemptAt))
      .limit(limit)
      .all();
    return rows.map((r) => ({
      tableName: r.tableName,
      rowId: r.rowId,
      code: r.code ?? 'INTERNAL',
      message: r.message ?? '',
      retryable: r.retryable,
      attempts: r.attempts,
      lastAttemptAt: r.lastAttemptAt ?? null,
    }));
  }

  /** Manual retry from "No enviados" (A-08): makes a rejected row due now. */
  async requeue(tableName: string, rowId: string, now: Date): Promise<void> {
    await this.#db
      .update(syncRowStatus)
      .set({ retryable: true, retryAfter: now.toISOString() })
      .where(byRow(tableName, rowId))
      .run();
  }

  /** Everything not accepted yet, terminal rejections apart (DB3-CAJA-02, `unsent.ts`). */
  async unsentCount(): Promise<number> {
    return (await unsentRows(this.#db)).length;
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
