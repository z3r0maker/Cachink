/**
 * Batched read of the current row state for a set of changes — one SELECT per
 * table instead of one per row (the LAN push queue did N+1) — converted back
 * to the domain shape the contract schemas validate.
 */

import { getTableColumns, inArray } from 'drizzle-orm';
import { PUSH_ROW_SCHEMAS, type PushableTable } from '@xangarro/contracts';
import type { CachinkDatabase } from '@xangarro/data';
import type { z } from 'zod';
import type { CoalescedChange } from './outbox-reader.js';
import { PUSH_TABLES, rowKey } from './table-map.js';

interface ZodDef {
  readonly type?: string;
  readonly innerType?: z.ZodType;
  readonly shape?: Record<string, z.ZodType>;
}

function defOf(s: z.ZodType): ZodDef {
  return (s as unknown as { _zod: { def: ZodDef } })._zod.def;
}

function isStructured(s: z.ZodType): boolean {
  const d = defOf(s);
  if (d.type === 'record' || d.type === 'array' || d.type === 'object') return true;
  return d.innerType ? isStructured(d.innerType) : false;
}

/** Fields stored as JSON text in SQLite but structured in the domain (products.atributos). */
function structuredFields(table: PushableTable): readonly string[] {
  const shape = defOf(PUSH_ROW_SCHEMAS[table]).shape ?? {};
  return Object.entries(shape)
    .filter(([, s]) => isStructured(s))
    .map(([k]) => k);
}

function toDomain(table: PushableTable, row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row };
  for (const field of structuredFields(table)) {
    const value = out[field];
    if (typeof value === 'string') out[field] = JSON.parse(value) as unknown;
  }
  return out;
}

/** `rowKey(table, id)` → domain-shaped row. Rows missing locally are absent. */
export async function readRows(
  db: CachinkDatabase,
  changes: readonly CoalescedChange[],
): Promise<Map<string, Record<string, unknown>>> {
  const idsByTable = new Map<PushableTable, string[]>();
  for (const c of changes) {
    const table = c.tableName as PushableTable;
    idsByTable.set(table, [...(idsByTable.get(table) ?? []), c.rowId]);
  }
  const out = new Map<string, Record<string, unknown>>();
  for (const [table, ids] of idsByTable) {
    const t = PUSH_TABLES[table];
    const idColumn = getTableColumns(t)['id'];
    if (!idColumn) continue;
    const rows = (await db.select().from(t).where(inArray(idColumn, ids)).all()) as Record<
      string,
      unknown
    >[];
    for (const r of rows) out.set(rowKey(table, String(r['id'])), toDomain(table, r));
  }
  return out;
}
