/**
 * Dangling-reference checks for a push, batched (contract §4; ADR-115).
 *
 * One lookup per referenced table per segment, for the ids not already seen to
 * exist — nothing a push does can make a row stop existing, so a hit is kept for
 * the rest of the push. A row may also point at a product or client stored
 * **earlier in the same push**; that counts only when the earlier row really was
 * written, and only when it came first — the answers one-by-one processing gave.
 *
 * When that earlier row failed **retryably** (a timeout, the savepoint budget),
 * the row pointing at it is retryable too, not FK_*_MISSING: both come back on
 * the next push, and the reference is there then (audit DB3-SYNC-02).
 */

import { PUSH_REFERENCES, type ErrorCode, type ReferencedTable } from '@xangarro/contracts';

import { rowOf, type Item } from './push-plan.js';
import { rowKey, type PushStore } from './push-store.js';

export interface Missing {
  readonly code: ErrorCode;
  readonly message: string;
}

export class PushReferences {
  private readonly known = new Map<ReferencedTable, Set<string>>();
  /** Referenced rows written by this push, by `rowKey`, with the index that wrote them. */
  private readonly written = new Map<string, number>();
  /** Referenced rows this push failed to write, retryably, by `rowKey`, with their index. */
  private readonly retrying = new Map<string, number>();

  constructor(private readonly store: PushStore) {}

  /** Look up, once per table, every id these items point at that is not known yet. */
  async load(items: readonly Item[]): Promise<void> {
    const wanted = new Map<ReferencedTable, Set<string>>();
    for (const { delta } of items) {
      for (const [field, table] of PUSH_REFERENCES) {
        const id = rowOf(delta)[field];
        if (typeof id !== 'string' || this.knownOf(table).has(id)) continue;
        wanted.set(table, (wanted.get(table) ?? new Set<string>()).add(id));
      }
    }
    await Promise.all(
      [...wanted].map(async ([table, ids]) => {
        const found = await this.store.existing(table, [...ids]);
        for (const id of found) this.knownOf(table).add(id);
      }),
    );
  }

  /** The first reference of this item that points at nothing, or null. */
  missing(item: Item): Missing | null {
    const row = rowOf(item.delta);
    for (const [field, table, code] of PUSH_REFERENCES) {
      const id = row[field];
      if (typeof id !== 'string' || this.knownOf(table).has(id)) continue;
      const k = rowKey(table, id);
      const by = this.written.get(k);
      if (by !== undefined && by < item.index) continue;
      const failed = this.retrying.get(k);
      if (failed !== undefined && failed < item.index) {
        return { code: 'INTERNAL', message: `${field}=${id} not stored yet; se reintentará.` };
      }
      return { code, message: `${field}=${id} not found` };
    }
    return null;
  }

  /** A row this push wrote (or found stored), which later rows may now point at. */
  wrote(item: Item): void {
    const k = rowKey(item.delta.table, item.delta.rowId);
    if (!this.written.has(k)) this.written.set(k, item.index);
  }

  /** A row this push could not write this time; rows pointing at it retry with it. */
  failed(item: Item): void {
    const k = rowKey(item.delta.table, item.delta.rowId);
    if (!this.retrying.has(k)) this.retrying.set(k, item.index);
  }

  private knownOf(table: ReferencedTable): Set<string> {
    let set = this.known.get(table);
    if (set === undefined) {
      set = new Set();
      this.known.set(table, set);
    }
    return set;
  }
}
