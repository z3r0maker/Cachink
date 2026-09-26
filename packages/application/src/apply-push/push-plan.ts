/**
 * The parts of a push decision that need no storage (B-08; ADR-110): the
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

import { rowKey } from './push-store.js';

type Accepted = PushResponse['accepted'][number];
export type Outcome = { accepted: Accepted } | { rejected: RejectedRow };

/** One delta of the push, with its place in it — answers keep that order. */
export interface Item {
  readonly index: number;
  readonly delta: Delta;
}

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

/** What a row fails before any lookup: its table and op, and its business. */
export function precheck(d: Delta, businessId: string): Outcome | null {
  if (!isPushable(d.table, d.op)) {
    const code = d.op === 'update' ? 'HYBRID_UPDATE_FORBIDDEN' : 'TABLE_NOT_WRITABLE';
    return rejected(d, code, `${d.table} ${d.op}`);
  }
  if (rowOf(d)['businessId'] !== businessId) {
    return rejected(d, 'BUSINESS_MISMATCH', 'row.businessId ≠ token');
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
