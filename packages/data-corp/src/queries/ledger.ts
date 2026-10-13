import type {
  CorpLedgerRepository,
  EntrySource,
  LedgerEntry,
  NewLedgerEntry,
} from '@xangarro/application/corp';
import { newUlid } from '@xangarro/domain';
import type { JournalLine } from '@xangarro/domain/corp';
import { and, asc, eq } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { closedPeriods, entries, entryLines } from '../schema/ledger.js';
import { projects } from '../schema/projects.js';
import { toEntry, type EntryRow } from './rows.js';
import { listPartnerEntries } from './socios.js';

/**
 * The ledger port over the corp schema (E-02). Entries and their lines are
 * written in one transaction; the deferred triggers of 0001_ledger_guards.sql
 * check the balance at its commit.
 */

const toJson = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)));

async function load(db: CorpDb, row: EntryRow | undefined): Promise<LedgerEntry | null> {
  if (row === undefined) return null;
  const lines = await db
    .select()
    .from(entryLines)
    .where(eq(entryLines.entryId, row.id))
    .orderBy(asc(entryLines.id));
  return toEntry(row, lines);
}

async function findById(db: CorpDb, id: string): Promise<LedgerEntry | null> {
  return load(db, (await db.select().from(entries).where(eq(entries.id, id)).limit(1))[0]);
}

async function findBySource(db: CorpDb, source: EntrySource, ref: string) {
  const where = and(eq(entries.source, source), eq(entries.sourceRef, ref));
  return load(db, (await db.select().from(entries).where(where).limit(1))[0]);
}

async function exists(db: CorpDb, query: 'project' | 'reversal', id: string): Promise<boolean> {
  const rows =
    query === 'project'
      ? await db.select({ id: projects.id }).from(projects).where(eq(projects.id, id)).limit(1)
      : await db
          .select({ id: entries.id })
          .from(entries)
          .where(eq(entries.reversesEntryId, id))
          .limit(1);
  return rows.length === 1;
}

/** The entry and its lines in one transaction; the triggers check the balance at commit. */
async function insert(db: CorpDb, entry: NewLedgerEntry, lines: readonly JournalLine[]) {
  const id = newUlid();
  const createdAt = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.insert(entries).values({ ...entry, id, payload: toJson(entry.payload), createdAt });
    await tx.insert(entryLines).values(
      lines.map((l, i) => ({
        id: `${id}-${String(i).padStart(2, '0')}`,
        entryId: id,
        cuenta: l.cuenta,
        debe: l.debe,
        haber: l.haber,
        socio: l.socio ?? null,
      })),
    );
  });
  const saved = await findById(db, id);
  if (saved === null) throw new Error(`corp entry ${id} vanished after insert`);
  return saved;
}

export function createCorpLedgerRepository(db: CorpDb): CorpLedgerRepository {
  return {
    projectExists: (id) => exists(db, 'project', id),
    closedPeriods: async () => {
      const rows = await db.select({ period: closedPeriods.period }).from(closedPeriods);
      return new Set(rows.map((r) => r.period));
    },
    findBySource: (source, ref) => findBySource(db, source, ref),
    findById: (id) => findById(db, id),
    isReversed: (id) => exists(db, 'reversal', id),
    listPartnerEntries: (range) => listPartnerEntries(db, range),
    insert: (entry, lines) => insert(db, entry, lines),
  };
}
