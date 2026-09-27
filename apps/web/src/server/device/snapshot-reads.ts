import 'server-only';

import type {
  PullableTable,
  SnapshotCursor,
  SnapshotItem,
  SnapshotReader,
  SnapshotSection,
} from '@xangarro/contracts';
import { inventoryMovements, SYNCED_TABLES } from '@xangarro/data-pg';
import { and, asc, gt, gte, isNull, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

import type { Tx } from '../db';
import { rowToWire, type Row } from '../sync/codec';

/**
 * What a snapshot page reads, section by section (C-23, ADR-120): keyset by
 * id, live rows only, inside the caller's tenant transaction — RLS scopes
 * every statement, nothing filters by business here.
 *
 * The baseline is **defined by the cursor, not by the clock**: the live
 * movements created before the cutoff whose `sync_log` entry is at or below
 * `c`. A movement is inserted once and never edited (ADR-081), so its one log
 * entry is its insert; one that lands after `c` — a phone pushing a week-old
 * sale late — is left out here and reaches the device through the ordinary
 * pull from `c`. So every page, whenever it is read, agrees with the others
 * and with the stream that follows.
 */
type Table = PgTable & { id: AnyPgColumn; deletedAt: AnyPgColumn };

const SIGNED = sql`CASE WHEN m.tipo = 'entrada' THEN m.cantidad ELSE -m.cantidad END`;

/** Parsed, never asserted (CLAUDE.md §2.8): `sum()` of integers is a Postgres bigint. */
function units(text: string): number {
  const n = Number(text);
  if (!Number.isSafeInteger(n)) throw new RangeError(`stock baseline out of range: ${text}`);
  return n;
}

async function readBaseline(
  tx: Tx,
  cursor: SnapshotCursor,
  after: string | null,
  limit: number,
): Promise<SnapshotItem[]> {
  const rows = await tx.execute<{ producto_id: string; cantidad: string }>(sql`
    SELECT m.producto_id, SUM(${SIGNED})::text AS cantidad
      FROM inventory_movements m
     WHERE m.deleted_at IS NULL
       AND m.created_at < ${cursor.cutoff}::timestamptz
       ${after === null ? sql`` : sql`AND m.producto_id > ${after}`}
       AND m.id NOT IN (SELECT l.row_id FROM sync_log l
                         WHERE l.table_name = 'inventory_movements' AND l.seq > ${cursor.c})
     GROUP BY m.producto_id
    HAVING SUM(${SIGNED}) <> 0
     ORDER BY m.producto_id
     LIMIT ${limit}`);
  return rows.map((r) => ({
    key: r.producto_id,
    row: { productoId: r.producto_id, cantidad: units(r.cantidad) },
  }));
}

async function readTable(
  tx: Tx,
  table: PullableTable,
  cursor: SnapshotCursor,
  after: string | null,
  limit: number,
): Promise<SnapshotItem[]> {
  const t = SYNCED_TABLES[table] as unknown as Table;
  // The business row travels even when archived, as the legacy bootstrap sent it.
  const where: SQL[] = table === 'businesses' ? [] : [isNull(t.deletedAt)];
  if (after !== null) where.push(gt(t.id, after));
  if (table === 'inventory_movements') where.push(gte(inventoryMovements.createdAt, cursor.cutoff));
  const rows = await tx
    .select()
    .from(t)
    .where(and(...where))
    .orderBy(asc(t.id))
    .limit(limit);
  return rows.map((r) => ({ key: String((r as Row)['id']), row: rowToWire(table, r as Row) }));
}

export function snapshotReader(tx: Tx, cursor: SnapshotCursor): SnapshotReader {
  return (section: SnapshotSection, after: string | null, limit: number) =>
    section === 'stock_baseline'
      ? readBaseline(tx, cursor, after, limit)
      : readTable(tx, section, cursor, after, limit);
}
