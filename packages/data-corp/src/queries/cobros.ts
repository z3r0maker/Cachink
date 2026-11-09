import { and, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { CorpDb } from '../client.js';
import { entries } from '../schema/ledger.js';

/**
 * Each Stripe payment's cobro, by the payment's id (E-10, board CD-06i): the
 * import posts one entry per payment with source `billing` and the id as its
 * ref. Facturas › Emitidas links each row to it, «Revertido» once a full
 * refund reversed it.
 */
export interface CobroDePago {
  readonly id: string;
  readonly revertida: boolean;
}

export async function cobrosDePagos(
  db: CorpDb,
  pagos: readonly string[],
): Promise<ReadonlyMap<string, CobroDePago>> {
  if (pagos.length === 0) return new Map();
  const reversa = alias(entries, 'reversa');
  const rows = await db
    .select({ id: entries.id, ref: entries.sourceRef, reversa: reversa.id })
    .from(entries)
    .leftJoin(reversa, eq(reversa.reversesEntryId, entries.id))
    .where(and(eq(entries.source, 'billing'), inArray(entries.sourceRef, [...pagos])));
  const out = new Map<string, CobroDePago>();
  for (const r of rows) {
    if (r.ref !== null) out.set(r.ref, { id: r.id, revertida: r.reversa !== null });
  }
  return out;
}
