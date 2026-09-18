import 'server-only';

import {
  DOWN_TABLES,
  HYBRID_TABLES,
  isPullable,
  MAX_PULL_ROWS_PER_TABLE,
  type PullableTable,
} from '@xangarro/contracts';
import { SYNCED_TABLES, syncLog } from '@xangarro/data-pg';
import { and, asc, gt, inArray, lte } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

import type { Tx } from '../db';
import { tenantFeatureFlags } from '../device/bootstrap';
import { rowToWire, type Row } from './codec';

/**
 * Everything that changed after `since`, up to `cursor` (B-09; contract §5).
 *
 * **One ordered stream, not one query per table** (audit DB-SYNC-04). Paging
 * each table to 5 000 and serving "the max returned" skips rows whenever two
 * tables truncate at different seqs. Here the page is the first N log entries
 * in seq order, and a truncated page's cursor is the last seq in it — so the
 * next pull starts exactly where this one stopped.
 *
 * Rows are sent as they are **now**, soft-deleted ones included: a tombstone
 * is a change the phone must apply.
 */
export const PAGE_SIZE: number = MAX_PULL_ROWS_PER_TABLE;

type Table = PgTable & { id: AnyPgColumn };
const PULLABLE: readonly PullableTable[] = [...DOWN_TABLES, ...HYBRID_TABLES];

async function rowsById(tx: Tx, table: PullableTable, ids: readonly string[]): Promise<Row[]> {
  if (ids.length === 0) return [];
  const t = SYNCED_TABLES[table] as unknown as Table;
  const rows = await tx
    .select()
    .from(t)
    .where(inArray(t.id, [...ids]));
  return rows.map((r) => rowToWire(table, r as Row));
}

export async function changesSince(tx: Tx, since: number, cursor: number, pageSize = PAGE_SIZE) {
  const entries = await tx
    .select({ seq: syncLog.seq, table: syncLog.tableName, rowId: syncLog.rowId })
    .from(syncLog)
    .where(and(gt(syncLog.seq, since), lte(syncLog.seq, cursor)))
    .orderBy(asc(syncLog.seq))
    .limit(pageSize + 1);
  const page = entries.slice(0, pageSize);
  const serverSeq = entries.length > pageSize ? (page.at(-1)?.seq ?? cursor) : cursor;

  const ids = new Map<PullableTable, Set<string>>(PULLABLE.map((t) => [t, new Set()]));
  for (const e of page) if (isPullable(e.table)) ids.get(e.table)?.add(e.rowId);

  const loaded = await Promise.all(
    PULLABLE.map(async (t) => [t, await rowsById(tx, t, [...(ids.get(t) ?? [])])] as const),
  );
  return {
    serverSeq,
    tables: { ...Object.fromEntries(loaded), feature_flags: tenantFeatureFlags() },
  };
}
