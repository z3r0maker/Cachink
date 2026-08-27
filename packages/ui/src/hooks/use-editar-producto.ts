/**
 * `useEditarProducto` — TanStack mutation wrapping
 * `EditarProductoUseCase.execute`. Invalidates productos / inventario
 * queries on success so the Stock list / Movimientos / Inventario KPIs
 * refresh.
 *
 * Audit Round 2 J3: powers the swipe-to-edit handler on the Stock
 * list (Phase K wiring).
 *
 * Review item #9: this invalidated `['products', businessId]` — an
 * English key nothing queries, so editing a producto refreshed
 * literally nothing. Same defect class as the dead `['sales']` /
 * `['expenses']` keys found earlier in the round. Now it invalidates
 * the real `['productos']` / `['productos-con-stock']` keys plus the
 * estados sweep, since costo and stock feed the Balance's inventory
 * line via `useBalanceGeneral`.
 */

import { useMemo } from 'react';
import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { Product, ProductId } from '@cachink/domain';
import type { ProductPatch } from '@cachink/data';
import { EditarProductoUseCase } from '@cachink/application';
import { useProductsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { estadosKeys } from './query-keys';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_EDITAR_PRODUCTO } from '../observability/audit-configs';

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

  return useAuditedMutation(MUTATION_EDITAR_PRODUCTO, {
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['productos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
        ...estadosKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
    },
  });
}
