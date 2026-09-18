'use server';

import { ArchivarProductoUseCase } from '@xangarro/application';
import type { BusinessId, ProductId } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
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
    const e = error as { code?: string; stock?: number; message?: string } | null;
    if (e?.code === 'STOCK_NOT_EMPTY') return { ok: false, kind: 'stock', stock: e.stock ?? 0 };
    if (e?.code === 'PRODUCT_NOT_FOUND' || e?.code === 'NOT_PERMITTED') {
      return { ok: false, kind: 'error', message: e.message ?? '' };
    }
    reportError(error, { endpoint: 'archivarProducto' });
    return {
      ok: false,
      kind: 'error',
      message: 'No pudimos archivar el producto. Intenta de nuevo.',
    };
  }
}
