import { and, eq, inArray, ne } from 'drizzle-orm';

import type { Db } from '../db/client';
import { supportItems } from '../db/support-schema';

/**
 * The open «pago sin CFDI» items for these payment refs (ADR-070, N-08), and
 * the month's global (`cfdi-global:<YYYY-MM>`): Facturas › Emitidas (E-10,
 * board CD-06i) links a payment still to issue to its item. Ref → item id.
 */
export async function facturasEnBandeja(
  db: Db,
  refs: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  if (refs.length === 0) return new Map();
  const rows = await db
    .select({ id: supportItems.id, ref: supportItems.paymentRef })
    .from(supportItems)
    .where(
      and(
        eq(supportItems.kind, 'factura'),
        ne(supportItems.status, 'resuelto'),
        inArray(supportItems.paymentRef, [...refs]),
      ),
    );
  const out = new Map<string, string>();
  for (const r of rows) if (r.ref !== null) out.set(r.ref, r.id);
  return out;
}
