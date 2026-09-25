'use server';

import { ArchivarProductoUseCase } from '@xangarro/application';
import type { BusinessId, ProductId } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { failure } from '../action-errors';
import { requireMember } from '../auth';
import { withTenant } from '../db';
import { pgMovementsCreator } from '../repositories/ledger';
import { pgProductsRepository } from '../repositories/products';

/**
 * Archive a product — from the portal only (owner decision, 2026-09-18). The
 * rule is `ArchivarProductoUseCase`'s: with units left, the owner confirms
 * first. The soft delete is logged, so the product leaves every phone's caja.
 */
export type ArchivarResult =
  | { ok: true }
  | { ok: false; kind: 'stock'; stock: number }
  | { ok: false; kind: 'error'; message: string };

export async function archivarProducto(id: string, force: boolean): Promise<ArchivarResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    await withTenant(businessId, (tx) =>
      new ArchivarProductoUseCase(
        pgProductsRepository(tx, businessId),
        pgMovementsCreator(tx, businessId),
      ).execute({ id: id as ProductId, force }),
    );
    revalidatePath('/productos');
    return { ok: true };
  } catch (error) {
    const e = error as { code?: string; stock?: number } | null;
    if (e?.code === 'STOCK_NOT_EMPTY') return { ok: false, kind: 'stock', stock: e.stock ?? 0 };
    const { message } = failure(error, 'archivarProducto', {
      shown: ['PRODUCT_NOT_FOUND'],
      retry: 'No pudimos archivar el producto. Intenta de nuevo.',
    });
    return { ok: false, kind: 'error', message };
  }
}
