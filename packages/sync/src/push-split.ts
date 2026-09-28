/**
 * A batch the server refuses as a whole (audit DB3-SYNC-01 b). A 400 — a
 * stricter schema reaching an older app — a 413, or a 5xx that repeats for
 * the same first batch used to leave the push high-water mark where it was,
 * so every later capture queued behind one row forever.
 *
 * Such a batch is **halved** down to the row at fault: the first half of the
 * part known to fail is sent; if it passes, its rows are answered and the
 * fault is in the rest; if not, the fault is in it. A single row still
 * refused is kept locally as rejected with the terminal `SERVER_REFUSED`
 * (it needs a person, like a server rejection) and the rest goes on. One
 * poison row among n costs at most ⌈log2 n⌉ + 1 further requests.
 *
 * A row is blamed only on evidence: a 413 on a row alone, or the server
 * accepting another part of the same batch. If a lone row and its lone
 * neighbour are both refused with nothing accepted, the server refuses
 * everything alike — nothing is marked and the error stands. Outages and
 * rate limits (network, timeout, 429, 503, anything with Retry-After) never
 * split: they keep the engine's backoff.
 */

import { MAX_PUSH_DELTAS } from '@xangarro/contracts';
import type { AppConfigRepository } from '@xangarro/data';
import type { CoalescedChange } from './outbox-reader.js';
import {
  exchange,
  part,
  sleepAfter,
  type PushDeps,
  type Prepared,
  type SyncError,
} from './push-batch.js';
import type { StatusStore } from './status-store.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';

/** The terminal code of a row the server refused on its own; never sent by a server. */
export const SERVER_REFUSED = 'SERVER_REFUSED';
/** A 5xx for the same first batch this many drains running is the batch's, not the server's. */
export const STRIKES_BEFORE_SPLIT = 3;
/** Requests one drain may spend splitting: two poison rows in a full batch. */
export const MAX_SPLIT_REQUESTS = 2 * (Math.ceil(Math.log2(MAX_PUSH_DELTAS)) + 2);

/** `refused` splits now, `failed` after repeated strikes, null never. */
export function refusalOf(e: SyncError): 'refused' | 'failed' | null {
  if (e.retryAfterMs !== undefined) return null;
  if (e.status === 400 || e.status === 413) return 'refused';
  return e.status >= 500 && e.status !== 503 ? 'failed' : null;
}

/** Counts a 5xx against the batch starting at `at`; true once it has struck enough. */
export async function struck(appConfig: AppConfigRepository, at: string): Promise<boolean> {
  const raw = await appConfig.get(SYNC_CONFIG_KEYS.pushStrikes);
  const prev = raw ? (JSON.parse(raw) as { at: string; count: number }) : null;
  const count = prev?.at === at ? prev.count + 1 : 1;
  await appConfig.set(SYNC_CONFIG_KEYS.pushStrikes, JSON.stringify({ at, count }));
  return count >= STRIKES_BEFORE_SPLIT;
}

export async function clearStrikes(appConfig: AppConfigRepository): Promise<void> {
  if ((await appConfig.get(SYNC_CONFIG_KEYS.pushStrikes)) !== null)
    await appConfig.delete(SYNC_CONFIG_KEYS.pushStrikes);
}

export interface SplitOutcome {
  readonly requests: number;
  readonly accepted: number;
  readonly rejected: number;
  /** Rows neither answered nor refused; they go again. */
  readonly unsettled: readonly CoalescedChange[];
  readonly error: SyncError | null;
}

interface Suspect {
  readonly index: number;
  readonly error: SyncError;
}

/** Where the halving stands: rows before `i` are done; the `bad` rows from `i` hold a fault. */
interface Walk {
  i: number;
  bad: number | null;
  evidence: boolean;
  held: Suspect | null;
  error: SyncError | null;
  requests: number;
  accepted: number;
  rejected: number;
  elapsed: number | null;
  readonly settled: Set<number>;
}

interface Ctx {
  readonly deps: PushDeps;
  readonly store: StatusStore;
  readonly p: Prepared;
}

const refusedMessage = (e: SyncError): string =>
  `El servidor no aceptó este registro (HTTP ${e.status} · ${e.code}).`;

async function refuse(ctx: Ctx, w: Walk, s: Suspect): Promise<void> {
  const c = ctx.p.sent[s.index]!;
  const rejection = { code: SERVER_REFUSED, message: refusedMessage(s.error), retryable: false };
  await ctx.store.markRejected(c.tableName, c.rowId, rejection, ctx.deps.now());
  w.settled.add(s.index);
  w.rejected += 1;
}

/** A held suspect waits for its neighbour alone; then the whole unknown rest; then halves. */
function probeSize(w: Walk, n: number): number {
  if (w.held !== null) return 1;
  if (w.bad === null) return n - w.i;
  return w.bad === 1 ? 1 : Math.floor(w.bad / 2);
}

async function passed(
  ctx: Ctx,
  w: Walk,
  size: number,
  counts: { accepted: number; rejected: number },
) {
  for (let k = w.i; k < w.i + size; k += 1) w.settled.add(k);
  w.i += size;
  w.accepted += counts.accepted;
  w.rejected += counts.rejected;
  w.evidence = true;
  w.bad = w.bad === null || w.bad <= size ? null : w.bad - size;
  if (w.held !== null) await refuse(ctx, w, w.held);
  w.held = null;
}

/** A row refused alone: blamed now on evidence, held until some, or proof it is the server. */
async function isolated(ctx: Ctx, w: Walk, error: SyncError): Promise<void> {
  const suspect = { index: w.i, error };
  w.i += 1;
  w.bad = null;
  if (error.status === 413 || w.evidence) await refuse(ctx, w, suspect);
  else if (w.held === null) w.held = suspect;
  else w.error = w.held.error;
}

async function probe(ctx: Ctx, w: Walk): Promise<void> {
  if (w.elapsed !== null) await (ctx.deps.pace ?? sleepAfter)(w.elapsed);
  const size = probeSize(w, ctx.p.deltas.length);
  const started = Date.now();
  const res = await exchange(ctx.deps, ctx.store, part(ctx.p, w.i, w.i + size));
  w.elapsed = Date.now() - started;
  w.requests += 1;
  if (res.ok) return passed(ctx, w, size, res);
  if (refusalOf(res.error) === null) w.error = res.error;
  else if (size > 1) w.bad = size;
  else await isolated(ctx, w, res.error);
}

/** Halves `p` — whose whole send just failed with a split-worthy `first` — row by row to the fault. */
export async function splitBatch(
  deps: PushDeps,
  store: StatusStore,
  p: Prepared,
  budget: { left: number },
): Promise<SplitOutcome> {
  const ctx = { deps, store, p };
  const w: Walk = {
    ...{ i: 0, bad: p.deltas.length, evidence: false, held: null, error: null },
    ...{ requests: 0, accepted: 0, rejected: 0, elapsed: null, settled: new Set<number>() },
  };
  while (w.i < p.deltas.length && w.error === null && budget.left > 0) {
    budget.left -= 1;
    await probe(ctx, w);
  }
  // A suspect nobody's acceptance cleared: the refusal stands, nothing is marked.
  if (w.held !== null) w.error ??= w.held.error;
  const unsettled = p.sent.filter((_, k) => !w.settled.has(k));
  const { requests, accepted, rejected, error } = w;
  return { requests, accepted, rejected, unsettled, error };
}
