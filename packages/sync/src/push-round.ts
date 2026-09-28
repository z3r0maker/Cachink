/**
 * One round of the push: the whole batch first; on a refusal of its own, the
 * halving (`push-split.ts`); on an outage, the retries it carried go back to
 * `rejected` for their next backoff (DB2-DEV-01).
 */

import type { CoalescedChange } from './outbox-reader.js';
import { exchange, type Prepared, type PushDeps, type SyncError } from './push-batch.js';
import { clearStrikes, refusalOf, splitBatch, struck } from './push-split.js';
import type { Round } from './push.js';
import type { StatusStore } from './status-store.js';
import { rowKey } from './table-map.js';

export interface RoundResult {
  readonly requests: number;
  readonly accepted: number;
  readonly rejected: number;
  /** Rows to send again: the cursor must not pass them. */
  readonly unsettled: readonly CoalescedChange[];
  readonly error: SyncError | null;
  /** The drain's halving budget ran out with rows still unsettled: stop for now. */
  readonly halted: boolean;
}

/** Retries left unsettled go back to `rejected`; nothing stays `pending`. */
async function restore(
  deps: PushDeps,
  store: StatusStore,
  r: Round,
  unsettled: readonly CoalescedChange[],
) {
  const retried = new Set(r.retries.map((c) => rowKey(c.tableName, c.rowId)));
  const back = unsettled.filter((c) => retried.has(rowKey(c.tableName, c.rowId)));
  if (back.length > 0) await store.restoreRetries(back, deps.now());
}

/** Whether a whole-batch failure is the batch's own: now (400/413) or after repeated 5xx. */
async function shouldSplit(deps: PushDeps, r: Round, p: Prepared, error: SyncError) {
  const kind = refusalOf(error);
  if (kind !== 'failed') return kind === 'refused';
  const first = p.sent[0];
  return struck(deps.appConfig, `${r.hwm}:${first ? rowKey(first.tableName, first.rowId) : ''}`);
}

export async function sendRound(
  deps: PushDeps,
  store: StatusStore,
  r: Round,
  p: Prepared,
  budget: { left: number },
): Promise<RoundResult> {
  const whole = await exchange(deps, store, p);
  if (whole.ok) {
    await clearStrikes(deps.appConfig);
    const { accepted, rejected } = whole;
    return { requests: 1, accepted, rejected, unsettled: [], error: null, halted: false };
  }
  if (!(await shouldSplit(deps, r, p, whole.error))) {
    await restore(deps, store, r, p.sent);
    const none = { accepted: 0, rejected: 0, halted: false };
    return { requests: 1, ...none, unsettled: p.sent, error: whole.error };
  }
  const split = await splitBatch(deps, store, p, budget);
  await restore(deps, store, r, split.unsettled);
  if (split.unsettled.length === 0) await clearStrikes(deps.appConfig);
  const halted = split.error === null && split.unsettled.length > 0;
  return { ...split, requests: split.requests + 1, halted };
}
