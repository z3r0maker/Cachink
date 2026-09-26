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
 * **Batched** (audit DB2-SYNC-01; ADR-110): the push is cut into segments of
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
  keyOf,
  precheck,
  rejected,
  rowOf,
  segments,
  type Item,
  type Outcome,
} from './push-plan.js';
import { PushReferences } from './push-references.js';
import { type PushReceipt, type PushStore, type Rejection } from './push-store.js';
import { PushWriter, type WriteResult } from './push-writer.js';

export type PushResult = Omit<PushResponse, 'serverTime'>;

/** Tables other rows point at, which a push may itself write: written first. */
const REFERENCED: ReadonlySet<string> = new Set(PUSH_REFERENCES.map(([, table]) => table));

type Receipts = ReadonlyMap<string, PushReceipt>;

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
    const [receipts] = await Promise.all([
      this.store.receipts(segment.map(({ delta: d }) => d)),
      references.load(segment),
    ]);
    const first = segment.filter((i) => REFERENCED.has(i.delta.table));
    const rest = segment.filter((i) => !REFERENCED.has(i.delta.table));
    const toAccept: Item[] = [];
    for (const tier of [first, rest]) {
      const toWrite = this.screen(tier, receipts, references, outcomes);
      const results = new Map<number, WriteResult>();
      for (const group of byTable(toWrite)) await writer.write(group.table, group.items, results);
      for (const item of toWrite) {
        const result = results.get(item.index) ?? 'internal';
        if (result === 'written') references.wrote(item);
        const outcome = decide(item, result, receipts);
        if (outcome === null) toAccept.push(item);
        else outcomes.set(item.index, outcome);
      }
    }
    await this.accept(toAccept, outcomes);
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
    if (rejections.length > 0) await this.store.reject(rejections);
    return { ...result, serverSeq: await this.store.finish(highest) };
  }
}

/** A written row's answer, or null when it is to be accepted at a fresh seq. */
function decide(item: Item, result: WriteResult, receipts: Receipts): Outcome | null {
  const d = item.delta;
  const receipt = receipts.get(keyOf(d));
  switch (result) {
    case 'written':
      return null;
    case 'internal':
      return rejected(d, 'INTERNAL', 'No se pudo guardar; se reintentará.');
    case 'foreign':
      return rejected(d, 'DUPLICATE_CONFLICT', `${d.table}/${d.rowId} belongs to another business`);
    // A HYBRID insert that is already here: this phone's own earlier push
    // (keep the portal's edits since), or an id nobody here ever sent.
    case 'exists':
      return receipt === undefined
        ? rejected(d, 'DUPLICATE_CONFLICT', `${d.table}/${d.rowId} already exists`)
        : accepted(d, receipt.seq);
    case 'stale':
      return receipt === undefined ? null : accepted(d, receipt.seq);
  }
}
