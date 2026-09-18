'use server';

import { revalidatePath } from 'next/cache';
import { EditarProductoUseCase } from '@xangarro/application';
import type { ProductPatch } from '@xangarro/data';
import type { BusinessId, ProductId } from '@xangarro/domain';

import { SESSION } from '@/fixtures/business';
import { withTenant } from '../db';
import { pgProductsRepository } from '../repositories/products';

/**
 * Edit a product from the portal.
 *
 * The whole point is how little is here. The rules — re-validate the patch,
 * refuse a missing row, forbid retroactive `costoUnitCentavos` — live in
 * `EditarProductoUseCase`, which the phone runs too, over the SQLite
 * implementation of the same `ProductsRepository` interface. This file is the
 * composition root and nothing else: open the tenant transaction, build the
 * repository over it, hand it to the use case.
 *
 * The transaction is the unit that matters. `withTenant` sets the RLS claim for
 * its duration, and the repository appends to `sync_log` inside it, so the row
 * change and the device-visible record of that change commit together or not at
 * all.
 *
 * Errors are returned, not thrown: a thrown error in a server action reaches
 * the client as an opaque digest, and "Ya existe un producto con ese SKU" is a
 * sentence the shopkeeper needs to read.
 */
export type EditResult = { ok: true } | { ok: false; message: string };

export async function editarProducto(id: string, patch: ProductPatch): Promise<EditResult> {
  // P-02 replaces the fixture with the real session; the tenant claim and the
  // write both key off this one value, so there is a single place to change.
  const businessId = SESSION.businessId as BusinessId;

  try {
    await withTenant(businessId, async (tx) => {
      const useCase = new EditarProductoUseCase(pgProductsRepository(tx, businessId));
      await useCase.execute({ id: id as ProductId, patch });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No pudimos guardar el producto. Intenta de nuevo.';
    console.error('[editarProducto]', error);
    return { ok: false, message };
  }

  revalidatePath('/productos');
  return { ok: true };
}
