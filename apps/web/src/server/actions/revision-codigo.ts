'use server';

import { revalidatePath } from 'next/cache';
import type { BusinessId, ProductId } from '@xangarro/domain';

import { failure, refusal } from '../action-errors';
import { requireMember } from '../auth';
import { withTenant } from '../db';
import { pgProductsRepository } from '../repositories/products';
import type { RevisionResult } from './revision';

/**
 * «Son distintos» (P-45, ADR-150 §4; board EcRevision): the pending product
 * the caja gave another product's barcode keeps its name and sales and loses
 * the code; the catalogue product keeps it. Through the products repository,
 * so the update is logged to `sync_log` in the same transaction and every
 * phone stops matching that code to it.
 */
export async function sonDistintos(id: string): Promise<RevisionResult> {
  try {
    const session = await requireMember();
    const businessId = session.business_id as BusinessId;
    await withTenant(businessId, async (tx) => {
      const products = pgProductsRepository(tx, businessId);
      const p = await products.findById(id as ProductId);
      if (p === null || p.estadoRevision !== 'pendiente') {
        throw refusal('YA_REVISADO', 'Ese producto ya no está en revisión.');
      }
      await products.update(id as ProductId, { sku: null });
    });
    revalidatePath('/revision-caja');
    return { ok: true };
  } catch (error) {
    return failure(error, 'sonDistintos', {
      retry: 'No se pudo quitar el código. Intenta de nuevo.',
    });
  }
}
