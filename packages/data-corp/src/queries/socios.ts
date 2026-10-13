import type {
  FundingCall,
  FundingCallRepository,
  NewFundingCall,
} from '@xangarro/application/corp';
import { newUlid } from '@xangarro/domain';
import type { Socio } from '@xangarro/domain/corp';
import { and, asc, desc, eq, exists, gte, inArray, isNotNull, lt, type SQL } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { entries, entryLines } from '../schema/ledger.js';
import { fundingCalls } from '../schema/socios.js';
import { withDetail, type Movimiento } from './movimientos.js';

/**
 * The partner accounts' reads and the funding calls (E-03, agreement Quinta).
 * A call's halves are ledger entries found by their `source_ref`; a reversed
 * half does not count as paid.
 */
export async function listPartnerEntries(
  db: CorpDb,
  range?: { readonly desde: string; readonly hasta: string },
): Promise<readonly Movimiento[]> {
  const where: SQL[] = [
    exists(
      db
        .select({ one: entryLines.id })
        .from(entryLines)
        .where(and(eq(entryLines.entryId, entries.id), isNotNull(entryLines.socio))),
    ),
  ];
  if (range !== undefined) {
    where.push(gte(entries.fecha, range.desde), lt(entries.fecha, range.hasta));
  }
  const rows = await db
    .select()
    .from(entries)
    .where(and(...where))
    .orderBy(asc(entries.fecha), asc(entries.createdAt), asc(entries.id));
  return withDetail(db, rows);
}

type CallRow = typeof fundingCalls.$inferSelect;

function toCall(row: CallRow): FundingCall {
  if (typeof row.total !== 'bigint' || typeof row.porSocio !== 'bigint') {
    throw new Error(`corp funding call ${row.id} amounts are not bigint`);
  }
  const { createdAt: _createdAt, ...call } = row;
  return call;
}

export function createFundingCallRepository(db: CorpDb): FundingCallRepository {
  return {
    async insert(call: NewFundingCall) {
      const id = newUlid();
      await db.insert(fundingCalls).values({ ...call, id, createdAt: new Date().toISOString() });
      return { ...call, id };
    },
    async findById(id: string) {
      const rows = await db.select().from(fundingCalls).where(eq(fundingCalls.id, id)).limit(1);
      return rows[0] === undefined ? null : toCall(rows[0]);
    },
  };
}

export interface MitadPagada {
  readonly entryId: string;
  readonly fecha: string;
}

export interface LlamadaConEstado extends FundingCall {
  readonly mitades: Readonly<Record<Socio, MitadPagada | null>>;
}

const ref = (id: string, socio: Socio) => `llamada:${id}:F${socio}`;

/** The latest calls, newest first, each with the halves already paid. */
export async function listFundingCalls(
  db: CorpDb,
  limit = 6,
): Promise<readonly LlamadaConEstado[]> {
  const rows = await db
    .select()
    .from(fundingCalls)
    .orderBy(desc(fundingCalls.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];
  const refs = rows.flatMap((r) => [ref(r.id, 1), ref(r.id, 2)]);
  const halves = await withDetail(
    db,
    await db
      .select()
      .from(entries)
      .where(and(eq(entries.source, 'manual'), inArray(entries.sourceRef, refs))),
  );
  const paid = new Map(
    halves
      .filter((h) => h.reversedBy === null)
      .map((h) => [h.sourceRef, { entryId: h.id, fecha: h.fecha }]),
  );
  return rows.map((r) => ({
    ...toCall(r),
    mitades: { 1: paid.get(ref(r.id, 1)) ?? null, 2: paid.get(ref(r.id, 2)) ?? null },
  }));
}
