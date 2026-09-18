/**
 * `POST /sync/push`'s rules (B-08; contract §4).
 *
 * Every delta gets its own outcome and **no row can fail the batch**: a bad
 * row is rejected with a reason, the rest are stored. Each row is written in
 * isolation (a savepoint in Postgres) so a failure halfway through a row
 * leaves nothing of it behind.
 *
 * Idempotent: a row pushed again at the same `updatedAt` is answered from its
 * receipt — same serverSeq, no second write — which is what lets the phone
 * retry a batch whose response it never received.
 */

import {
  ERROR_CATALOG,
  isPushable,
  PUSH_REFERENCES,
  type Delta,
  type ErrorCode,
  type PushRequest,
  type PushResponse,
  type RejectedRow,
} from '@xangarro/contracts';

import { ForeignRowError, type PushStore } from './push-store.js';

type Accepted = PushResponse['accepted'][number];
type Outcome = { accepted: Accepted } | { rejected: RejectedRow };
export type PushResult = Omit<PushResponse, 'serverTime'>;

const rejected = (d: Delta, code: ErrorCode, message: string): Outcome => ({
  rejected: {
    rowId: d.rowId,
    clientSeq: d.clientSeq,
    code,
    message,
    retryable: ERROR_CATALOG[code].retryable,
  },
});

const accepted = (d: Delta, serverSeq: number): Outcome => ({
  accepted: { rowId: d.rowId, clientSeq: d.clientSeq, serverSeq },
});

export class ApplyPushUseCase {
  constructor(
    private readonly store: PushStore,
    private readonly businessId: string,
    /** Unexpected failures: reported per row as retryable, and logged here. */
    private readonly logError: (error: unknown) => void,
  ) {}

  async execute(request: PushRequest): Promise<PushResult> {
    const result: PushResult = { accepted: [], rejected: [], serverSeq: 0 };
    for (const d of request.deltas) {
      const outcome = await this.one(d);
      if ('accepted' in outcome) result.accepted.push(outcome.accepted);
      else {
        await this.store.reject(d, outcome.rejected);
        result.rejected.push(outcome.rejected);
      }
    }
    const highest = Math.max(0, ...result.accepted.map((a) => a.serverSeq));
    return { ...result, serverSeq: await this.store.finish(highest) };
  }

  private async one(d: Delta): Promise<Outcome> {
    const row = d.row as Record<string, unknown>;
    if (!isPushable(d.table, d.op)) {
      const code = d.op === 'update' ? 'HYBRID_UPDATE_FORBIDDEN' : 'TABLE_NOT_WRITABLE';
      return rejected(d, code, `${d.table} ${d.op}`);
    }
    if (row['businessId'] !== this.businessId) {
      return rejected(d, 'BUSINESS_MISMATCH', 'row.businessId ≠ token');
    }
    const missing = await this.missingReference(row);
    if (missing !== null) return rejected(d, missing.code, missing.message);

    const receipt = await this.store.receipt(d.table, d.rowId);
    if (receipt !== null && receipt.rowUpdatedAt === row['updatedAt']) {
      return accepted(d, receipt.seq);
    }
    try {
      return await this.store.isolated((row) => this.write(row, d, receipt?.seq ?? null));
    } catch (error) {
      if (error instanceof ForeignRowError) return rejected(d, 'DUPLICATE_CONFLICT', error.message);
      this.logError(error);
      return rejected(d, 'INTERNAL', 'No se pudo guardar; se reintentará.');
    }
  }

  private async write(store: PushStore, d: Delta, receiptSeq: number | null): Promise<Outcome> {
    const outcome = await store.write(d);
    // A HYBRID insert that is already here: this phone's own earlier push
    // (keep the portal's edits since), or an id nobody here ever sent.
    if (outcome === 'exists') {
      return receiptSeq === null
        ? rejected(d, 'DUPLICATE_CONFLICT', `${d.table}/${d.rowId} already exists`)
        : accepted(d, receiptSeq);
    }
    if (outcome === 'stale' && receiptSeq !== null) return accepted(d, receiptSeq);
    return accepted(d, await store.accept(d));
  }

  private async missingReference(
    row: Record<string, unknown>,
  ): Promise<{ code: ErrorCode; message: string } | null> {
    for (const [field, table, code] of PUSH_REFERENCES) {
      const id = row[field];
      if (typeof id === 'string' && !(await this.store.exists(table, id))) {
        return { code, message: `${field}=${id} not found` };
      }
    }
    return null;
  }
}
