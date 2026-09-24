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

/** The field at fault, in the form's own words; the schema's are written for logs. */
const CAMPO: Readonly<Record<string, string>> = {
  nombre: 'Escribe el nombre del producto.',
  sku: 'Revisa el SKU: hasta 64 caracteres.',
  precioVentaCentavos: 'Revisa el precio de venta.',
  umbralStockBajo: 'El aviso de existencias bajas no puede ser negativo.',
};

type Refusal = { code?: string; name?: string; issues?: readonly { path?: readonly unknown[] }[] };

/**
 * A deleted product or a missing role: its own sentence. A patch the schema
 * refuses: the field, in the form's words — never the validator's JSON. Only
 * what is left is an incident, reported behind the retry message.
 */
function fallo(error: unknown): { ok: false; message: string } {
  const e = (error ?? {}) as Refusal;
  if (e.code === 'PRODUCT_NOT_FOUND' || e.code === 'NOT_PERMITTED') {
    return { ok: false, message: (error as Error).message };
  }
  if (e.name === 'ZodError') {
    const campo = String(e.issues?.[0]?.path?.[0] ?? '');
    return { ok: false, message: CAMPO[campo] ?? 'Revisa los datos del producto.' };
  }
  reportError(error, { endpoint: 'editarProducto' });
  return { ok: false, message: 'No pudimos guardar el producto. Intenta de nuevo.' };
}

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
    return fallo(error);
  }

  revalidatePath('/productos');
  return { ok: true };
}
