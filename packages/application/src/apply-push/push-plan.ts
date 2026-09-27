/**
 * The parts of a push decision that need no storage (B-08; ADR-116): the
 * per-row answers, the checks a row fails before anything is looked up, and
 * how a batch is cut into segments that can each be written in one go.
 */

import {
  ERROR_CATALOG,
  isPushable,
  type Delta,
  type ErrorCode,
  type PushableTable,
  type PushResponse,
  type RejectedRow,
} from '@xangarro/contracts';

import { rowKey, type PushReceipt } from './push-store.js';
import type { WriteResult } from './push-writer.js';
import { unstorableText } from './unstorable-text.js';

type Accepted = PushResponse['accepted'][number];
export type Outcome = { accepted: Accepted } | { rejected: RejectedRow };

/** One delta of the push, with its place in it — answers keep that order. */
export interface Item {
  readonly index: number;
  readonly delta: Delta;
}

/** Receipts by `rowKey`. */
export type Receipts = ReadonlyMap<string, PushReceipt>;

export const rowOf = (d: Delta): Record<string, unknown> => d.row as Record<string, unknown>;
export const keyOf = (d: Delta): string => rowKey(d.table, d.rowId);

export const rejected = (d: Delta, code: ErrorCode, message: string): Outcome => ({
  rejected: {
    rowId: d.rowId,
    clientSeq: d.clientSeq,
    code,
    message,
    retryable: ERROR_CATALOG[code].retryable,
  },
});

export const accepted = (d: Delta, serverSeq: number): Outcome => ({
  accepted: { rowId: d.rowId, clientSeq: d.clientSeq, serverSeq },
});

/**
 * What a row fails before any lookup: its table and op, its business, and text
 * Postgres cannot store — refused here, terminally, before it can fail a write
 * or the rejection that would keep it (DB3-SYNC-01).
 */
export function precheck(d: Delta, businessId: string): Outcome | null {
  if (!isPushable(d.table, d.op)) {
    const code = d.op === 'update' ? 'HYBRID_UPDATE_FORBIDDEN' : 'TABLE_NOT_WRITABLE';
    return rejected(d, code, `${d.table} ${d.op}`);
  }
  if (rowOf(d)['businessId'] !== businessId) {
    return rejected(d, 'BUSINESS_MISMATCH', 'row.businessId ≠ token');
  }
  const bad = unstorableText(d.rowId, 'rowId') ?? unstorableText(d.row, 'row');
  if (bad !== null) {
    return rejected(d, 'VALIDATION', `${bad}: a NUL character or an unpaired surrogate`);
  }
  return null;
}

/**
 * Cut the push where a row repeats. Within a segment every row is distinct, so
 * one statement per table can carry it (Postgres refuses to upsert a row twice
 * in one command) and one receipt lookup answers it. A row pushed twice — a
 * turno opened and then closed — lands in the next segment, which sees the
 * first one stored and accepted, exactly as one-by-one processing would.
 */
export function segments(items: readonly Item[]): Item[][] {
  const out: Item[][] = [];
  let current: Item[] = [];
  let seen = new Set<string>();
  for (const item of items) {
    const k = keyOf(item.delta);
    if (seen.has(k)) {
      out.push(current);
      current = [];
      seen = new Set();
    }
    seen.add(k);
    current.push(item);
  }
  if (current.length > 0) out.push(current);
  return out;
}

/** Items grouped by table, tables in the order they first appear. */
export function byTable(items: readonly Item[]): { table: PushableTable; items: Item[] }[] {
  const groups = new Map<PushableTable, Item[]>();
  for (const item of items) {
    const group = groups.get(item.delta.table) ?? [];
    group.push(item);
    groups.set(item.delta.table, group);
  }
  return [...groups].map(([table, group]) => ({ table, items: group }));
}

/** A written row's answer, or null when it is to be accepted at a fresh seq. */
export function decide(item: Item, result: WriteResult, receipts: Receipts): Outcome | null {
  const d = item.delta;
  const receipt = receipts.get(keyOf(d));
  switch (result) {
    case 'written':
      return null;
    case 'internal':
      return rejected(d, 'INTERNAL', 'No se pudo guardar; se reintentará.');
    case 'invalid':
      return rejected(d, 'VALIDATION', `${d.table}/${d.rowId} has a value the database refuses`);
    case 'duplicate':
      return rejected(d, 'DUPLICATE_CONFLICT', `${d.table}/${d.rowId} repeats another row's key`);
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
