/**
 * `useEditarProducto` — TanStack mutation wrapping
 * `EditarProductoUseCase.execute`. Invalidates productos / inventario
 * queries on success so the Stock list / Movimientos / Inventario KPIs
 * refresh.
 *
 * Audit Round 2 J3: powers the swipe-to-edit handler on the Stock
 * list (Phase K wiring).
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { Product, ProductId } from '@cachink/domain';
import type { ProductPatch } from '@cachink/data';
import { EditarProductoUseCase } from '@cachink/application';
import { useProductsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface EditarProductoInput {
  readonly id: ProductId;
  readonly patch: ProductPatch;
}

export type EditarProductoResult = UseMutationResult<Product, Error, EditarProductoInput, unknown>;

export function useEditarProducto(): EditarProductoResult {
  const products = useProductsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  const useCase = useMemo(() => new EditarProductoUseCase(products), [products]);

  return useMutation<Product, Error, EditarProductoInput>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['products', businessId] });
    },
  });
}
