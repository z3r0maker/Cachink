import 'server-only';

import {
  snapshotPagesEstimate,
  SNAPSHOT_SECTIONS,
  type PullableTable,
  type SnapshotCursor,
} from '@xangarro/contracts';
import { SYNCED_TABLES } from '@xangarro/data-pg';
import { getTableName, sql, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

import type { Tx } from '../db';

/**
 * DS-10's «3 de 7»: how many pages a snapshot will take, sent on its first
 * page. One statement summing each section's count under the reader's own
 * rules (`snapshot-reads.ts`): live rows, the business row even archived,
 * movements from the cutoff on. The stock baseline is counted as one row per
 * product, an upper bound: its exact size is the aggregation of the tenant's
 * whole history, which each baseline page already pays and the first page
 * need not pay twice.
 */
function cuenta(section: PullableTable, cursor: SnapshotCursor): SQL {
  const tabla = sql.identifier(getTableName(SYNCED_TABLES[section] as unknown as PgTable));
  const where: SQL[] = section === 'businesses' ? [sql`true`] : [sql`deleted_at IS NULL`];
  if (section === 'inventory_movements')
    where.push(sql`created_at >= ${cursor.cutoff}::timestamptz`);
  return sql`(SELECT count(*) FROM ${tabla} WHERE ${sql.join(where, sql` AND `)})`;
}

export async function paginasDelSnapshot(tx: Tx, cursor: SnapshotCursor): Promise<number> {
  const partes = SNAPSHOT_SECTIONS.map((s) =>
    s === 'stock_baseline' ? sql`(SELECT count(*) FROM products)` : cuenta(s, cursor),
  );
  const [row] = await tx.execute<{ n: string }>(
    sql`SELECT (${sql.join(partes, sql` + `)})::text AS n`,
  );
  return snapshotPagesEstimate(Number(row?.n ?? 0));
}
