/**
 * `POST /sync/push`'s rules (B-08; contract §4).
 *
 * Every delta gets its own outcome and **no row can fail the batch**: a bad
 * row is rejected with a reason, the rest are stored. A write that fails is
 * split until the row that failed it is found (`PushWriter`), so a failure
 * leaves nothing of that row behind and nothing of the others undone.
 *
 * Idempotent: a row pushed again at the same `updatedAt` is answered from its
 * receipt — same serverSeq, no second write — which is what lets the phone
 * retry a batch whose response it never received.
 *
 * **Batched** (audit DB2-SYNC-01; ADR-118): the push is cut into segments of
 * distinct rows, and each segment costs one receipt lookup, one reference
 * lookup per referenced table, one write per table and one `accept` — a
 * constant number of statements, however many rows it carries. Products and
 * clients are written before the rows that may point at them; seqs are handed
 * out in delta order.
 */

import { PUSH_REFERENCES, type PushRequest, type PushResponse } from '@xangarro/contracts';

import {
  accepted,
  byTable,
  decide,
  keyOf,
  precheck,
  rejected,
  rowOf,
  segments,
  type Item,
  type Outcome,
  type Receipts,
} from './push-plan.js';
import { PushReferences } from './push-references.js';
import { type PushReceipt, type PushStore, type Rejection } from './push-store.js';
import { PushWriter, type WriteResult } from './push-writer.js';

export type PushResult = Omit<PushResponse, 'serverTime'>;

/** Tables other rows point at, which a push may itself write: written first. */
const REFERENCED: ReadonlySet<string> = new Set(PUSH_REFERENCES.map(([, table]) => table));

export class ApplyPushUseCase {
  constructor(
    private readonly store: PushStore,
    private readonly businessId: string,
    /** Unexpected failures: reported per row as retryable, and logged here. */
    private readonly logError: (error: unknown) => void,
  ) {}

  async execute(request: PushRequest): Promise<PushResult> {
    const outcomes = new Map<number, Outcome>();
    const candidates: Item[] = [];
    request.deltas.forEach((delta, index) => {
      const early = precheck(delta, this.businessId);
      if (early === null) candidates.push({ index, delta });
      else outcomes.set(index, early);
    });
    const references = new PushReferences(this.store);
    const writer = new PushWriter(this.store, this.logError);
    for (const segment of segments(candidates)) {
      await this.segment(segment, outcomes, references, writer);
    }
    return this.answer(request, outcomes);
  }

  private async segment(
    segment: readonly Item[],
    outcomes: Map<number, Outcome>,
    references: PushReferences,
    writer: PushWriter,
  ): Promise<void> {
    // Independent lookups: sent together (Postgres pipelines them).
    const [found] = await Promise.all([
      this.store.receipts(segment.map(({ delta: d }) => d)),
      references.load(segment),
    ]);
    const receipts = new Map(found);
    const first = segment.filter((i) => REFERENCED.has(i.delta.table));
    const rest = segment.filter((i) => !REFERENCED.has(i.delta.table));
    const toAccept: Item[] = [];
    for (const tier of [first, rest]) {
      const toWrite = this.screen(tier, receipts, references, outcomes);
      const results = await this.write(toWrite, writer, receipts);
      for (const item of toWrite) {
        const result = results.get(item.index) ?? 'internal';
        track(references, item, result);
        const outcome = decide(item, result, receipts);
        if (outcome === null) toAccept.push(item);
        else outcomes.set(item.index, outcome);
      }
    }
    await this.accept(toAccept, outcomes);
  }

  /**
   * Write a tier, one statement per table. A row that came back already stored
   * without a receipt at the segment's start may be an overlapping push's, which
   * committed while this one waited on its lock: its receipt is looked up again
   * before the row is answered (audit DB3-SYNC-03).
   */
  private async write(
    items: readonly Item[],
    writer: PushWriter,
    receipts: Map<string, PushReceipt>,
  ): Promise<Map<number, WriteResult>> {
    const results = new Map<number, WriteResult>();
    for (const group of byTable(items)) await writer.write(group.table, group.items, results);
    const inDoubt = items.filter((i) => {
      const result = results.get(i.index);
      return (result === 'exists' || result === 'stale') && !receipts.has(keyOf(i.delta));
    });
    if (inDoubt.length > 0) {
      const late = await this.store.receipts(inDoubt.map((i) => i.delta));
      for (const [k, receipt] of late) receipts.set(k, receipt);
    }
    return results;
  }

  /** Answer what needs no write; return the rest, to be written. */
  private screen(
    tier: readonly Item[],
    receipts: Receipts,
    references: PushReferences,
    outcomes: Map<number, Outcome>,
  ): Item[] {
    const toWrite: Item[] = [];
    for (const item of tier) {
      const d = item.delta;
      const missing = references.missing(item);
      const receipt = receipts.get(keyOf(d));
      if (missing !== null) outcomes.set(item.index, rejected(d, missing.code, missing.message));
      else if (receipt !== undefined && receipt.rowUpdatedAt === rowOf(d)['updatedAt']) {
        outcomes.set(item.index, accepted(d, receipt.seq));
      } else toWrite.push(item);
    }
    return toWrite;
  }

  private async accept(items: Item[], outcomes: Map<number, Outcome>): Promise<void> {
    if (items.length === 0) return;
    items.sort((a, b) => a.index - b.index);
    const seqs = await this.store.accept(items.map((i) => i.delta));
    items.forEach((item, j) => outcomes.set(item.index, accepted(item.delta, seqs[j] ?? 0)));
  }

  private async answer(request: PushRequest, outcomes: Map<number, Outcome>): Promise<PushResult> {
    const result: PushResult = { accepted: [], rejected: [], serverSeq: 0 };
    const rejections: Rejection[] = [];
    let highest = 0;
    request.deltas.forEach((delta, index) => {
      const outcome = outcomes.get(index);
      if (outcome === undefined) throw new Error(`push: delta ${index} has no outcome`);
      if ('accepted' in outcome) {
        result.accepted.push(outcome.accepted);
        highest = Math.max(highest, outcome.accepted.serverSeq);
      } else {
        result.rejected.push(outcome.rejected);
        rejections.push({ delta, rejection: outcome.rejected });
      }
    });
    await this.keep(rejections);
    return { ...result, serverSeq: await this.store.finish(highest) };
  }

  /**
   * Keep the rejections in their own savepoint, and without their payloads if
   * that fails: bookkeeping never fails the push — a failure here used to roll
   * back every row the push stored, forever (audit DB3-SYNC-01).
   */
  private async keep(rejections: readonly Rejection[]): Promise<void> {
    if (rejections.length === 0) return;
    try {
      await this.store.isolated((s) => s.reject(rejections));
    } catch (error) {
      this.logError(error);
      await this.store
        .isolated((s) => s.reject(rejections, { withoutPayload: true }))
        .catch((again: unknown) => this.logError(again));
    }
  }
}

/** What a tier's write tells the reference checks of the rows after it. */
function track(references: PushReferences, item: Item, result: WriteResult): void {
  if (result === 'written' || result === 'exists' || result === 'stale') references.wrote(item);
  else if (result === 'internal') references.failed(item);
}
