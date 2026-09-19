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

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { ArchivarProductoUseCase } from '@xangarro/application';
import type { ProductId } from '@xangarro/domain';
import { useInventoryMovementsRepository, useProductsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_ELIMINAR_PRODUCTO } from '../observability/audit-configs';

/** The domain's error, re-exported so existing imports keep working. */
export { StockNotEmptyError } from '@xangarro/domain';

export interface EliminarProductoInput {
  readonly id: ProductId;
  readonly currentStock: number;
  readonly force?: boolean;
}

export type EliminarProductoResult = UseMutationResult<void, Error, EliminarProductoInput, unknown>;

export function useEliminarProducto(): EliminarProductoResult {
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useAuditedMutation(MUTATION_ELIMINAR_PRODUCTO, {
    async mutationFn(input) {
      // The rule (units left → confirm first) is the shared use case's; the
      // portal archives through the same one. `currentStock` stays in the
      // input for the audit record.
      await new ArchivarProductoUseCase(products, movements).execute({
        id: input.id,
        force: input.force,
      });
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['productos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
      ]);
    },
  });
}
