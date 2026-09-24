'use server';

/**
 * Revisión de caja's three exits (O-37), writing for real. Approve completes
 * the record (and, for a product, writes the stock the owner counted as an
 * entrada — stock is the sum of movements, ADR-081); reject closes it; merge
 * marks the duplicate and re-points its facts to the surviving record.
 */

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  clients,
  inventoryMovements,
  products,
  sales,
  tickets,
  clientPayments,
} from '@xangarro/data-pg';
import { newEntityId } from '@xangarro/domain';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { PORTAL_DEVICE_ID } from '../repositories/portal-device';
import { reportError } from '../observability/report';

export type RevisionResult = { ok: true } | { ok: false; message: string };

/** A read-only member hears why; anything else is reported behind the retry line. */
function fallo(error: unknown, endpoint: string, retry: string): { ok: false; message: string } {
  if ((error as { code?: string } | null)?.code === 'NOT_PERMITTED') {
    return { ok: false, message: (error as Error).message };
  }
  reportError(error, { endpoint });
  return { ok: false, message: retry };
}

export interface ProductoAprobado {
  readonly precioCentavos: bigint;
  readonly costoCentavos: bigint;
  readonly categoria: string;
  readonly existencias: number;
  readonly umbral: number;
}

export async function aprobarProducto(id: string, f: ProductoAprobado): Promise<RevisionResult> {
  try {
    const session = await requireMember();
    await withTenant(session.business_id, async (tx) => {
      await tx
        .update(products)
        .set({
          precioVentaCentavos: f.precioCentavos,
          costoUnitCentavos: f.costoCentavos,
          categoria: 'Producto Terminado',
          umbralStockBajo: f.umbral,
          estadoRevision: 'aprobado',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, id));
      const now = new Date().toISOString();
      await tx.insert(inventoryMovements).values({
        id: newEntityId(),
        productoId: id,
        fecha: now.slice(0, 10),
        tipo: 'entrada',
        cantidad: f.existencias,
        costoUnitCentavos: f.costoCentavos,
        motivo: 'Ajuste de inventario',
        businessId: session.business_id,
        deviceId: PORTAL_DEVICE_ID,
        createdByUserId: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    });
    revalidatePath('/revision-caja');
    return { ok: true };
  } catch (error) {
    return fallo(error, 'aprobarProducto', 'No se pudo aprobar el producto. Intenta de nuevo.');
  }
}

export async function aprobarCliente(
  id: string,
  limiteCentavos: bigint,
  plazoDias: number,
): Promise<RevisionResult> {
  try {
    const session = await requireMember();
    await withTenant(session.business_id, async (tx) => {
      await tx
        .update(clients)
        .set({
          limiteCentavos: limiteCentavos,
          plazoDias: plazoDias,
          estadoRevision: 'aprobado',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(clients.id, id));
    });
    revalidatePath('/revision-caja');
    return { ok: true };
  } catch (error) {
    return fallo(error, 'aprobarCliente', 'No se pudo aprobar el cliente. Intenta de nuevo.');
  }
}

export async function rechazar(tipo: 'producto' | 'cliente', id: string): Promise<RevisionResult> {
  try {
    const session = await requireMember();
    await withTenant(session.business_id, async (tx) => {
      const table = tipo === 'producto' ? products : clients;
      await tx
        .update(table)
        .set({ estadoRevision: 'rechazado', updatedAt: new Date().toISOString() })
        .where(eq(table.id, id));
    });
    revalidatePath('/revision-caja');
    return { ok: true };
  } catch (error) {
    return fallo(error, 'rechazar', 'No se pudo rechazar. Intenta de nuevo.');
  }
}

/** The duplicate's facts move to the surviving record; the row says which. */
export async function fusionar(
  tipo: 'producto' | 'cliente',
  id: string,
  haciaId: string,
): Promise<RevisionResult> {
  try {
    const session = await requireMember();
    await withTenant(session.business_id, async (tx) => {
      if (tipo === 'producto') {
        await tx.update(sales).set({ productoId: haciaId }).where(eq(sales.productoId, id));
      } else {
        await tx.update(tickets).set({ clienteId: haciaId }).where(eq(tickets.clienteId, id));
        await tx
          .update(clientPayments)
          .set({ clienteId: haciaId })
          .where(eq(clientPayments.clienteId, id));
      }
      const table = tipo === 'producto' ? products : clients;
      await tx
        .update(table)
        .set({
          estadoRevision: 'fusionado',
          fusionadoConId: haciaId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(table.id, id));
    });
    revalidatePath('/revision-caja');
    return { ok: true };
  } catch (error) {
    return fallo(error, 'fusionar', 'No se pudo fusionar. Intenta de nuevo.');
  }
}
