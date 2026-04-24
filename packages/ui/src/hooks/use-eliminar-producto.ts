/**
 * `useEliminarProducto` — TanStack mutation wrapping
 * ProductsRepository.delete (soft-delete). Phase 1C guardrail:
 * refuses to delete a producto with stock > 0 unless `force=true`
 * is explicitly passed (after user confirmation).
 *
 * Invalidates both ['productos', businessId] and
 * ['productos-con-stock', businessId] so the Stock list and every
 * cached select refreshes.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ProductId } from '@cachink/domain';
import { useProductsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export class StockNotEmptyError extends Error {
  constructor(public readonly currentStock: number) {
    super(`Producto has ${currentStock} unidades en stock — reduce to 0 first.`);
    this.name = 'StockNotEmptyError';
  }
}

export interface EliminarProductoInput {
  readonly id: ProductId;
  readonly currentStock: number;
  readonly force?: boolean;
}

export type EliminarProductoResult = UseMutationResult<void, Error, EliminarProductoInput, unknown>;

export function useEliminarProducto(): EliminarProductoResult {
  const products = useProductsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<void, Error, EliminarProductoInput>({
    async mutationFn(input) {
      if (input.currentStock > 0 && input.force !== true) {
        throw new StockNotEmptyError(input.currentStock);
      }
      await products.delete(input.id);
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['productos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
      ]);
    },
  });
}
