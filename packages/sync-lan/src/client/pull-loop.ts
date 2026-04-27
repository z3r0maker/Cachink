/**
 * Pull loop — fetches deltas from `/api/v1/sync/pull?since=<hwm>` and
 * applies them locally via an LWW upsert. Runs on a timer; paused while
 * the WebSocket is alive (WS wake-ups trigger immediate one-shot pulls).
 *
 * Apply strategy:
 *   - Open a transaction per batch, `PRAGMA foreign_keys=OFF`, run the
 *     upserts, commit, then `PRAGMA foreign_keys=ON`. The cross-table
 *     order of deltas is not guaranteed (a sale may arrive before the
 *     client it references), so we disable FK checks for the duration of
 *     the batch and rely on the domain schema to catch referential bugs
 *     at the app layer.
 *   - Every row goes through the same LWW SQL the server uses: the
 *     local row wins if its `updated_at` is strictly greater, or equal
 *     and its `device_id` is lexicographically smaller.
 *   - Rejected rows go into `__cachink_conflicts` so the UI can surface
 *     them (Slice 5 C20).
 */

import { sql } from 'drizzle-orm';
import type { CachinkDatabase } from '@cachink/data';
import { readHwm, writeHwm } from '@cachink/data';
import {
  API_PATHS,
  API_PREFIX,
  MAX_BATCH_SIZE,
  PROTOCOL_HEADER,
  PROTOCOL_VERSION,
} from '../protocol/constants.js';
import { decodeDelta, isSyncedTable } from '../protocol/codec.js';
import { pullResponseSchema, type Delta } from '../protocol/wire.js';
import { buildUpsertLww, rowsAffectedFrom } from './upsert-lww.js';

export interface PullDeps {
  db: CachinkDatabase;
  serverUrl: string;
  accessToken: string;
  fetchImpl?: typeof fetch;
}

export interface PullResult {
  batchesPulled: number;
  deltasApplied: number;
  deltasRejected: number;
  lastServerSeq: number;
}

export async function runPullCycle(deps: PullDeps): Promise<PullResult> {
  const result: PullResult = {
    batchesPulled: 0,
    deltasApplied: 0,
    deltasRejected: 0,
    lastServerSeq: 0,
  };
  for (;;) {
    const hwm = await readHwm(deps.db, 'serverPullHwm');
    const page = await fetchPullPage(deps, hwm);
    if (page.deltas.length === 0) {
      result.lastServerSeq = Math.max(result.lastServerSeq, page.nextSince);
      return result;
    }
    const applied = await applyDeltas(deps.db, page.deltas);
    result.batchesPulled += 1;
    result.deltasApplied += applied.applied;
    result.deltasRejected += applied.rejected;
    result.lastServerSeq = Math.max(result.lastServerSeq, page.nextSince);
    await writeHwm(deps.db, 'serverPullHwm', page.nextSince);
    if (!page.hasMore) return result;
  }
}

async function fetchPullPage(
  deps: PullDeps,
  since: number,
): Promise<{ deltas: Delta[]; nextSince: number; hasMore: boolean }> {
  const url = `${deps.serverUrl}${API_PREFIX}${API_PATHS.PULL}?since=${since}&limit=${MAX_BATCH_SIZE}`;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const res = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${deps.accessToken}`,
      [PROTOCOL_HEADER]: String(PROTOCOL_VERSION),
    },
  });
  if (!res.ok) throw new Error(`pull failed: HTTP ${res.status}`);
  return pullResponseSchema.parse(await res.json());
}

interface ApplyResult {
  applied: number;
  rejected: number;
}

async function applyDeltas(db: CachinkDatabase, deltas: readonly Delta[]): Promise<ApplyResult> {
  const decoded = deltas.filter((d) => isSyncedTable(d.table)).map((d) => decodeDelta(d));
  if (decoded.length === 0) return { applied: 0, rejected: 0 };

  let applied = 0;
  let rejected = 0;
  await db.run(sql`BEGIN IMMEDIATE`);
  try {
    await db.run(sql`PRAGMA foreign_keys = OFF`);
    for (const delta of decoded) {
      const stmt = buildUpsertLww(delta.table, delta.decodedRow);
      const raw = await db.run(stmt);
      if (rowsAffectedFrom(raw) > 0) {
        applied += 1;
      } else {
        rejected += 1;
        await recordInboundConflict(db, delta);
      }
    }
    await db.run(sql`PRAGMA foreign_keys = ON`);
    await db.run(sql`COMMIT`);
  } catch (error) {
    await db.run(sql`ROLLBACK`);
    throw error;
  }
  return { applied, rejected };
}

async function recordInboundConflict(db: CachinkDatabase, delta: Delta): Promise<void> {
  const tableQuoted = sql.raw(`"${delta.table}"`);
  await db.run(sql`
    INSERT INTO __cachink_conflicts
      (direction, table_name, row_id, loser_updated_at, loser_device_id,
       winner_updated_at, winner_device_id, reason)
    VALUES (
      'inbound',
      ${delta.table},
      ${delta.rowId},
      ${delta.rowUpdatedAt},
      ${delta.rowDeviceId},
      COALESCE((SELECT updated_at FROM ${tableQuoted} WHERE id = ${delta.rowId}), ${delta.rowUpdatedAt}),
      COALESCE((SELECT device_id  FROM ${tableQuoted} WHERE id = ${delta.rowId}), ${delta.rowDeviceId}),
      'stale'
    )`);
}
