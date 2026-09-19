'use server';

import { CrearProductoUseCase } from '@xangarro/application';
import type { BusinessId, NewProduct } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
import { pgProductsRepository } from '../repositories/products';

/**
 * «Nuevo producto» (P-07, ADR-080). The rules are `CrearProductoUseCase`'s —
 * the phone's own. Constructed **without** a movements store: a product made
 * here starts at zero stock, and stock is added with a movement (ADR-081).
 * The insert is logged, so every phone gets the product on its next pull.
 */
export type NuevoProductoForm = Omit<
  NewProduct,
  'businessId' | 'atributos' | 'estadoRevision' | 'fusionadoConId'
>;
export type CrearProductoResult = { ok: true; id: string } | { ok: false; message: string };

const KNOWN = new Set(['PRODUCT_INVALID', 'INITIAL_STOCK_NOT_ALLOWED', 'NOT_PERMITTED']);

export async function crearProducto(form: NuevoProductoForm): Promise<CrearProductoResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    const product = await withTenant(businessId, (tx) =>
      new CrearProductoUseCase(pgProductsRepository(tx, businessId)).execute({
        product: { ...form, businessId },
      }),
    );
    revalidatePath('/productos');
    return { ok: true, id: product.id };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (error instanceof Error && code !== undefined && KNOWN.has(code)) {
      return { ok: false, message: error.message };
    }
    reportError(error, { endpoint: 'crearProducto' });
    return { ok: false, message: 'No pudimos crear el producto. Intenta de nuevo.' };
  }
}
