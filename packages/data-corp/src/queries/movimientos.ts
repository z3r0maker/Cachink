import type { LedgerEntry } from '@xangarro/application/corp';
import { and, asc, desc, eq, gte, inArray, lt, type SQL } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { entries, entryLines } from '../schema/ledger.js';
import { toEntry, type LineRow } from './rows.js';

/**
 * The Movimientos screen's reads (E-02): one month of entries, newest first,
 * each with its lines and, when it was undone, the entry that undid it.
 */
export interface Movimiento extends LedgerEntry {
  readonly createdAt: string;
  /** The reversal's id when this entry was reversed, in any month. */
  readonly reversedBy: string | null;
}

const PERIOD = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** `[first day, first day of the next month)` of a `YYYY-MM`, or null. */
export function monthBounds(period: string): readonly [string, string] | null {
  const m = PERIOD.exec(period);
  if (m === null) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
  return [`${period}-01`, `${next}-01`];
}

export async function withDetail(db: CorpDb, rows: readonly (typeof entries.$inferSelect)[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [lines, reversals] = await Promise.all([
    db
      .select()
      .from(entryLines)
      .where(inArray(entryLines.entryId, ids))
      .orderBy(asc(entryLines.id)),
    db
      .select({ id: entries.id, of: entries.reversesEntryId })
      .from(entries)
      .where(inArray(entries.reversesEntryId, ids)),
  ]);
  const byEntry = new Map<string, LineRow[]>();
  for (const l of lines) byEntry.set(l.entryId, [...(byEntry.get(l.entryId) ?? []), l]);
  const reversedBy = new Map(reversals.map((r) => [r.of, r.id]));
  return rows.map(
    (r): Movimiento => ({
      ...toEntry(r, byEntry.get(r.id) ?? []),
      createdAt: r.createdAt,
      reversedBy: reversedBy.get(r.id) ?? null,
    }),
  );
}

/** Every entry dated in `period` (`YYYY-MM`), newest first. */
export async function listMovimientos(
  db: CorpDb,
  period: string,
  projectId?: string,
): Promise<readonly Movimiento[]> {
  const bounds = monthBounds(period);
  if (bounds === null) throw new Error(`not a month: ${period}`);
  const where: SQL[] = [gte(entries.fecha, bounds[0]), lt(entries.fecha, bounds[1])];
  if (projectId !== undefined) where.push(eq(entries.projectId, projectId));
  const rows = await db
    .select()
    .from(entries)
    .where(and(...where))
    .orderBy(desc(entries.fecha), desc(entries.createdAt), desc(entries.id));
  return withDetail(db, rows);
}

export async function getMovimiento(db: CorpDb, id: string): Promise<Movimiento | null> {
  const rows = await db.select().from(entries).where(eq(entries.id, id)).limit(1);
  return (await withDetail(db, rows))[0] ?? null;
}

/** The concepto and date of each entry, for labelling what a document proves. */
export async function conceptosDe(
  db: CorpDb,
  ids: readonly string[],
): Promise<ReadonlyMap<string, { readonly concepto: string; readonly fecha: string }>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: entries.id, concepto: entries.concepto, fecha: entries.fecha })
    .from(entries)
    .where(inArray(entries.id, [...ids]));
  return new Map(rows.map((r) => [r.id, { concepto: r.concepto, fecha: r.fecha }]));
}
