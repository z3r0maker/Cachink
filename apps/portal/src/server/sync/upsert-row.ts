import 'server-only';

import { ForeignRowError, type WriteOutcome } from '@xangarro/application';
import type { PushableTable } from '@xangarro/contracts';
import { SYNCED_TABLES } from '@xangarro/data-pg';
import { eq, sql } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

import type { Tx } from '../db';
import type { Row } from './codec';

/**
 * One pushed row into its table (B-08).
 *
 * An id that exists in **another** business is invisible under RLS. With
 * `ON CONFLICT DO UPDATE` Postgres still finds the conflict and then refuses
 * the update with 42501 (audit DB-SYNC-05) — which is the signal, not a crash:
 * it becomes `ForeignRowError`, and the use case answers DUPLICATE_CONFLICT.
 */
type SyncTable = PgTable & { id: AnyPgColumn; updatedAt: AnyPgColumn };

const RLS_VIOLATION = '42501';

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code ?? e?.cause?.code;
}

async function visible(tx: Tx, t: SyncTable, id: unknown): Promise<boolean> {
  const [r] = await tx
    .select({ id: t.id })
    .from(t)
    .where(eq(t.id, id as string));
  return r !== undefined;
}

export async function upsertRow(
  tx: Tx,
  table: PushableTable,
  row: Row,
  insertOnly: boolean,
): Promise<WriteOutcome> {
  const t = SYNCED_TABLES[table] as unknown as SyncTable;
  const { id: _id, ...changes } = row;
  try {
    const insert = tx.insert(t).values(row as never);
    const written = insertOnly
      ? await insert.onConflictDoNothing({ target: t.id }).returning({ id: t.id })
      : await insert
          .onConflictDoUpdate({
            target: t.id,
            set: changes as never,
            // Last write wins by the row's own clock; an older push keeps the newer row.
            setWhere: sql`${t.updatedAt} < excluded.updated_at`,
          })
          .returning({ id: t.id });
    if (written.length > 0) return 'written';
  } catch (error) {
    if (pgCode(error) === RLS_VIOLATION) throw new ForeignRowError(table, String(row['id']));
    throw error;
  }
  if (!(await visible(tx, t, row['id']))) throw new ForeignRowError(table, String(row['id']));
  return insertOnly ? 'exists' : 'stale';
}
