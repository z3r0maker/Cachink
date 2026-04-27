/**
 * Push queue — drains `__cachink_change_log` to the LAN server in batches
 * (ADR-029 push path).
 *
 * Reads every change-log row with `id > localPushHwm`, joins to the
 * entity table for the current payload, encodes each as a {@link Delta},
 * and posts at most `MAX_BATCH_SIZE` rows per request. On a 200 OK the
 * high-water-mark advances to the max id in the batch; on any other
 * response or a network error, the HWM stays put and the next call
 * retries.
 *
 * The queue is passive: it does nothing on a timer. The orchestrator
 * wakes it up when triggers fire (via SQL change notification or a
 * periodic tick) and after a successful WebSocket reconnect.
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
import { encodeDelta, isSyncedTable } from '../protocol/codec.js';
import { pushResponseSchema, type Delta, type PushResponse } from '../protocol/wire.js';

interface ChangeLogEntry {
  id: number;
  table_name: string;
  row_id: string;
  op: 'insert' | 'update';
}

export interface PushDeps {
  db: CachinkDatabase;
  serverUrl: string;
  accessToken: string;
  fetchImpl?: typeof fetch;
}

export interface PushResult {
  batchesSent: number;
  deltasAccepted: number;
  deltasRejected: number;
  lastServerSeq: number;
}

export async function drainPushQueue(deps: PushDeps): Promise<PushResult> {
  const result: PushResult = {
    batchesSent: 0,
    deltasAccepted: 0,
    deltasRejected: 0,
    lastServerSeq: 0,
  };
  for (;;) {
    const hwm = await readHwm(deps.db, 'localPushHwm');
    const batch = await readChangeLogBatch(deps.db, hwm);
    if (batch.length === 0) return result;

    const deltas = await encodeBatch(deps.db, batch);
    if (deltas.length === 0) {
      await writeHwm(deps.db, 'localPushHwm', maxId(batch));
      continue;
    }
    const response = await postPush(deps, deltas);
    result.batchesSent += 1;
    result.deltasAccepted += response.accepted;
    result.deltasRejected += response.rejected.length;
    result.lastServerSeq = Math.max(result.lastServerSeq, response.lastServerSeq);
    await writeHwm(deps.db, 'localPushHwm', maxId(batch));
  }
}

async function readChangeLogBatch(db: CachinkDatabase, since: number): Promise<ChangeLogEntry[]> {
  const rows = (await db.all(
    sql`SELECT id, table_name, row_id, op
        FROM __cachink_change_log
        WHERE id > ${since}
        ORDER BY id ASC
        LIMIT ${MAX_BATCH_SIZE}`,
  )) as ChangeLogEntry[];
  return rows;
}

async function encodeBatch(
  db: CachinkDatabase,
  batch: readonly ChangeLogEntry[],
): Promise<Delta[]> {
  const deltas: Delta[] = [];
  for (const entry of batch) {
    if (!isSyncedTable(entry.table_name)) continue;
    const row = await readEntityRow(db, entry.table_name, entry.row_id);
    if (!row) continue;
    deltas.push(encodeDelta(entry.table_name, row, entry.op));
  }
  return deltas;
}

async function readEntityRow(
  db: CachinkDatabase,
  table: string,
  rowId: string,
): Promise<Record<string, unknown> | null> {
  // Table names come from an allowlist (`isSyncedTable`) so this interpolation
  // is safe. Drizzle's `sql.identifier` isn't available on the async shim.
  const rows = (await db.all(
    sql.raw(`SELECT * FROM "${table}" WHERE id = '${rowId.replace(/'/g, "''")}' LIMIT 1`),
  )) as Array<Record<string, unknown>>;
  return rows[0] ?? null;
}

function maxId(batch: readonly ChangeLogEntry[]): number {
  return batch.reduce((acc, r) => (r.id > acc ? r.id : acc), 0);
}

async function postPush(deps: PushDeps, deltas: readonly Delta[]): Promise<PushResponse> {
  const url = `${deps.serverUrl}${API_PREFIX}${API_PATHS.PUSH}`;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deps.accessToken}`,
      [PROTOCOL_HEADER]: String(PROTOCOL_VERSION),
    },
    body: JSON.stringify({ deltas }),
  });
  if (!res.ok) {
    throw new Error(`push failed: HTTP ${res.status}`);
  }
  const body: unknown = await res.json();
  return pushResponseSchema.parse(body);
}
