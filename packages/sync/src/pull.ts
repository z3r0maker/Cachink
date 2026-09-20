/**
 * pullAll — fetches reference data and entitlement from `/sync/pull`
 * (A-06, contracts §5), applies it, and advances the cursors.
 *
 * Stores the server-anchored clocks the rest of the app depends on:
 * `lastServerTime` and `lastPullAt` (entitlement staleness, retention) and
 * `acknowledgedThrough` (the retention purge bound, A-11).
 */

import type { AppConfigRepository, XangarroDatabase } from '@xangarro/data';
import type { ApiClient } from './api-client.js';
import type { SyncError } from './push.js';
import { applyReferenceTables } from './reference-applier.js';
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

async function readSeq(appConfig: AppConfigRepository): Promise<number> {
  return Number((await appConfig.get(SYNC_CONFIG_KEYS.pullSeq)) ?? '0') || 0;
}

type PulledPage = Extract<Awaited<ReturnType<ApiClient['pull']>>, { ok: true }>['data'];

function countRows(tables: PulledPage['tables']): number {
  return Object.entries(tables)
    .filter(([k]) => k !== 'feature_flags')
    .reduce((n, [, rows]) => n + (rows as readonly unknown[]).length, 0);
}

async function storePage(deps: PullDeps, page: PulledPage): Promise<void> {
  const c = deps.appConfig;
  await c.set(SYNC_CONFIG_KEYS.entitlement, JSON.stringify(page.entitlement));
  await c.set(SYNC_CONFIG_KEYS.lastServerTime, page.serverTime);
  await c.set(SYNC_CONFIG_KEYS.lastPullAt, page.serverTime);
  await c.set(SYNC_CONFIG_KEYS.acknowledgedThrough, String(page.acknowledgedThrough));
  await c.set(SYNC_CONFIG_KEYS.pullSeq, String(page.serverSeq));
}

export async function pullAll(deps: PullDeps, maxPages = 10): Promise<PullOutcome> {
  let pages = 0;
  let applied = 0;
  while (pages < maxPages) {
    const since = await readSeq(deps.appConfig);
    const res = await deps.client.pull(deps.token, since);
    if (!res.ok) return { pages, applied, error: { code: res.code, status: res.status } };
    pages += 1;
    const rows = countRows(res.data.tables);
    await applyReferenceTables(deps.db, res.data.tables, res.data.entitlement.payload.businessId);
    await storePage(deps, res.data);
    applied += rows;
    if (rows === 0 || res.data.serverSeq <= since) break;
  }
  return { pages, applied, error: null };
}
