import type { FacturaRecibida, ReceivedInvoiceRepository } from '@xangarro/application/corp';
import { and, asc, desc, eq, gte, inArray, isNotNull, lt, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { CorpDb } from '../client.js';
import { receivedInvoices as ri } from '../schema/facturas.js';
import { entries } from '../schema/ledger.js';
import { categoriaDe, toFactura, toRow } from './facturas-rows.js';
import { monthBounds } from './movimientos.js';

/**
 * Received invoices over the corp schema (E-11). The guards of
 * 0006_zz_corp_facturas_guards.sql refuse any move the application does not
 * make: nothing is deleted, and what an XML says never changes.
 */
const now = () => new Date().toISOString();

async function porUuid(db: CorpDb, uuid: string): Promise<FacturaRecibida | null> {
  const rows = await db.select().from(ri).where(eq(ri.uuid, uuid)).limit(1);
  return rows[0] === undefined ? null : toFactura(rows[0]);
}

async function cambiar(db: CorpDb, uuid: string, set: Partial<typeof ri.$inferInsert>) {
  await db
    .update(ri)
    .set({ ...set, updatedAt: now() })
    .where(eq(ri.uuid, uuid));
}

async function recordadaPara(db: CorpDb, rfc: string) {
  const rows = await db
    .select({ categoria: ri.categoria, projectId: ri.projectId })
    .from(ri)
    .where(and(eq(ri.emisorRfc, rfc), isNotNull(ri.entryId)))
    .orderBy(desc(ri.updatedAt))
    .limit(1);
  const categoria = categoriaDe(rows[0]?.categoria ?? null);
  return categoria === null ? null : { categoria, projectId: rows[0]?.projectId ?? null };
}

export function createReceivedInvoiceRepository(db: CorpDb): ReceivedInvoiceRepository {
  return {
    porUuid: (uuid) => porUuid(db, uuid),
    guardar: async (f) => {
      const row = toRow(f, now());
      const { uuid: _uuid, createdAt: _createdAt, ...set } = row;
      await db
        .insert(ri)
        .values(row)
        .onConflictDoUpdate({ target: ri.uuid, set, setWhere: sql`${ri.estado} = 'descartada'` });
    },
    porRevisar: async () =>
      (
        await db.select().from(ri).where(eq(ri.estado, 'por_revisar')).orderBy(asc(ri.createdAt))
      ).map(toFactura),
    xmlDe: async (uuid) => {
      const rows = await db.select({ xml: ri.xml }).from(ri).where(eq(ri.uuid, uuid)).limit(1);
      return rows[0] === undefined ? null : new Uint8Array(rows[0].xml);
    },
    marcarRegistrada: (uuid, r) => cambiar(db, uuid, { ...r, estado: 'registrada' }),
    marcarPagada: (uuid, pagoEntryId) => cambiar(db, uuid, { pagoEntryId }),
    marcarCancelada: (uuid) => cambiar(db, uuid, { estado: 'cancelada' }),
    descartar: async (uuid) => {
      await db
        .update(ri)
        .set({ estado: 'descartada', updatedAt: now() })
        .where(and(eq(ri.uuid, uuid), eq(ri.estado, 'por_revisar')));
    },
    recordadaPara: (rfc) => recordadaPara(db, rfc),
  };
}

export interface FacturaDelMes {
  readonly factura: FacturaRecibida;
  /** Its expense was reversed, by «Cancelar» or from Movimientos. */
  readonly revertida: boolean;
  /** `YYYY-MM-DD` of the payment of an invoice on credit, once paid (board CD-06e). */
  readonly pagadaEl: string | null;
  /** `YYYY-MM-DD` of the reversal of its expense (board CD-06f). */
  readonly revertidaEl: string | null;
}

/**
 * The month's received invoices for board CD-06b, by issue date, newest
 * first: registered and cancelled ones; what waits for review or was
 * discarded is not «received» yet.
 */
export async function facturasDelMes(db: CorpDb, mes: string): Promise<readonly FacturaDelMes[]> {
  const bounds = monthBounds(mes);
  if (bounds === null) throw new Error(`facturasDelMes: «${mes}» is not a month`);
  const [desde, hasta] = bounds;
  const reversa = alias(entries, 'reversa');
  const pago = alias(entries, 'pago');
  const rows = await db
    .select({ row: ri, reversa: reversa.fecha, pago: pago.fecha })
    .from(ri)
    .leftJoin(reversa, eq(reversa.reversesEntryId, ri.entryId))
    .leftJoin(pago, eq(pago.id, ri.pagoEntryId))
    .where(
      and(
        gte(ri.fecha, desde),
        lt(ri.fecha, hasta),
        inArray(ri.estado, ['registrada', 'cancelada']),
      ),
    )
    .orderBy(desc(ri.fecha), desc(ri.createdAt));
  return rows.map((r) => ({
    factura: toFactura(r.row),
    revertida: r.reversa !== null,
    pagadaEl: r.pago,
    revertidaEl: r.reversa,
  }));
}
