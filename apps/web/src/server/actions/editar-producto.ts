'use server';

import { revalidatePath } from 'next/cache';
import { EditarProductoUseCase } from '@xangarro/application';
import type { ProductPatch } from '@xangarro/data';
import type { BusinessId, ProductId } from '@xangarro/domain';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { pgProductsRepository } from '../repositories/products';
import { reportError } from '../observability/report';

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
  try {
    // Before anything else, and on the server: hiding the Editar button from a
    // viewer is a courtesy, not a control — a viewer can still call this action
    // directly. The tenant comes from the same signed cookie, so a caller
    // cannot name someone else's business either.
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;

    await withTenant(businessId, async (tx) => {
      const useCase = new EditarProductoUseCase(pgProductsRepository(tx, businessId));
      await useCase.execute({ id: id as ProductId, patch });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No pudimos guardar el producto. Intenta de nuevo.';
    reportError(error, { endpoint: 'editarProducto' });
    return { ok: false, message };
  }

  revalidatePath('/productos');
  return { ok: true };
}
