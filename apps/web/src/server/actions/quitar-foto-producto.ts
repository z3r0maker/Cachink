'use server';

import { revalidatePath } from 'next/cache';
import { QuitarFotoProductoUseCase } from '@xangarro/application';
import type { BusinessId, ProductId } from '@xangarro/domain';

import { failure, type FailurePolicy } from '../action-errors';
import { requireMember } from '../auth';
import { withTenant } from '../db';
import { pgProductImagesRepository } from '../repositories/product-images';
import { pgProductsRepository } from '../repositories/products';

/**
 * «Quitar foto» from the portal (P-42, ADR-134): a tombstone row through the
 * same `QuitarFotoProductoUseCase` the phone runs (M-13), over the Postgres
 * repositories. The row and its `sync_log` entry commit together, so every
 * phone drops the photo on its next pull and goes back to the icon.
 */
export type QuitarFotoResult = { ok: true } | { ok: false; message: string };

/** An unknown product or a photo already gone: their own sentence; the rest is retried. */
const REFUSALS: FailurePolicy = {
  shown: ['PRODUCT_NOT_FOUND', 'PRODUCT_IMAGE_MISSING'],
  invalid: () => 'No pudimos quitar la foto. Intenta de nuevo.',
  retry: 'No pudimos quitar la foto. Intenta de nuevo.',
};

export async function quitarFotoProducto(productoId: string): Promise<QuitarFotoResult> {
  try {
    // On the server, before anything: hiding the button from a viewer is not a control.
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    await withTenant(businessId, async (tx) => {
      const useCase = new QuitarFotoProductoUseCase(
        pgProductsRepository(tx, businessId),
        pgProductImagesRepository(tx, businessId),
      );
      await useCase.execute({ productoId: productoId as ProductId });
    });
  } catch (error) {
    return failure(error, 'quitarFotoProducto', REFUSALS);
  }
  revalidatePath('/productos');
  return { ok: true };
}
