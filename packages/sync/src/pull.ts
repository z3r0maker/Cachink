/**
 * pullAll — fetches reference data and entitlement from `/sync/pull`
 * (A-06, contracts §5), applies it, and advances the cursors.
 *
 * Stores the server-anchored clocks the rest of the app depends on:
 * `lastServerTime` and `lastPullAt` (entitlement staleness, retention) and
 * `acknowledgedThrough` (the retention purge bound, A-11).
 *
 * A device with no cursor bootstraps by **snapshot** (C-23, ADR-119): pages
 * of reference rows, recent movements and a stock baseline, followed to the
 * last one through `bootstrapNext`, then the ordinary pull from the
 * snapshot's cursor. An unfinished snapshot resumes where it stopped. Each
 * page is applied, cursors included, in one transaction.
 */

import { SNAPSHOT_START, type PullResponse } from '@xangarro/contracts';
import type { AppConfigRepository, XangarroDatabase } from '@xangarro/data';
import type { ApiClient } from './api-client.js';
import { applyPulledPage, cursorWrites, type CursorWrites } from './page-applier.js';
import { toSyncError, type SyncError } from './push-batch.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';

export interface PullDeps {
  readonly db: XangarroDatabase;
  readonly appConfig: AppConfigRepository;
  readonly client: ApiClient;
  readonly token: string;
}

export interface PullOutcome {
  readonly pages: number;
  /** Reference rows applied across all pages. */
  readonly applied: number;
  readonly error: SyncError | null;
}

/** Snapshot pages one run may fetch — 1 M rows; an unfinished snapshot resumes next run. */
export const MAX_SNAPSHOT_PAGES_PER_RUN = 200;

interface Request {
  readonly since: number;
  /** `start`, a token to continue, or `null` for an ordinary pull. */
  readonly snapshot: string | null;
}

async function nextRequest(appConfig: AppConfigRepository): Promise<Request> {
  const since = Number((await appConfig.get(SYNC_CONFIG_KEYS.pullSeq)) ?? '0') || 0;
  const open = await appConfig.get(SYNC_CONFIG_KEYS.bootstrapNext);
  if (open) return { since, snapshot: open };
  return { since, snapshot: since === 0 ? SNAPSHOT_START : null };
}

function countRows(page: PullResponse): number {
  const rows = Object.entries(page.tables)
    .filter(([k]) => k !== 'feature_flags')
    .reduce((n, [, list]) => n + (list as readonly unknown[]).length, 0);
  return rows + (page.snapshot?.stockBaseline.length ?? 0);
}

function pageWrites(page: PullResponse): CursorWrites {
  return {
    ...cursorWrites(page),
    [SYNC_CONFIG_KEYS.entitlement]: JSON.stringify(page.entitlement),
    [SYNC_CONFIG_KEYS.lastPullAt]: page.serverTime,
    [SYNC_CONFIG_KEYS.acknowledgedThrough]: String(page.acknowledgedThrough),
  };
}

type Step =
  | { readonly rows: number; readonly snapshot: boolean; readonly more: boolean }
  | { readonly error: SyncError };

async function pullOnce(deps: PullDeps): Promise<Step> {
  const req = await nextRequest(deps.appConfig);
  const res = await deps.client.pull(deps.token, req.since, req.snapshot ?? undefined);
  if (!res.ok) return { error: toSyncError(res) };
  const page = res.data;
  await applyPulledPage(deps.db, page, page.entitlement.payload.businessId, pageWrites(page));
  const rows = countRows(page);
  if (req.snapshot === null) {
    return { rows, snapshot: false, more: rows > 0 && page.serverSeq > req.since };
  }
  // A finished snapshot goes on with the ordinary pull from its cursor, which
  // brings what changed while it was paged — unless there is no cursor yet.
  return { rows, snapshot: true, more: Boolean(page.snapshot?.next) || page.serverSeq > 0 };
}

export async function pullAll(deps: PullDeps, maxPages = 10): Promise<PullOutcome> {
  let pages = 0;
  let snapshots = 0;
  let applied = 0;
  while (pages < maxPages && snapshots < MAX_SNAPSHOT_PAGES_PER_RUN) {
    const step = await pullOnce(deps);
    if ('error' in step) return { pages: pages + snapshots, applied, error: step.error };
    applied += step.rows;
    if (step.snapshot) snapshots += 1;
    else pages += 1;
    if (!step.more) break;
  }
  return { pages: pages + snapshots, applied, error: null };
}
