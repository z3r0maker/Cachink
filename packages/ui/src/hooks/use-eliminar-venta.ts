/**
 * `useEliminarVenta` — TanStack mutation wrapping
 * `SalesRepository.delete` (soft-delete via `deletedAt`).
 * Invalidates the `['ventas', businessId, fecha]` query so the list
 * refreshes immediately.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { IsoDate, SaleId } from '@cachink/domain';
import { useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface EliminarVentaInput {
  readonly id: SaleId;
  readonly fecha: IsoDate;
}

export type EliminarVentaResult = UseMutationResult<void, Error, EliminarVentaInput, unknown>;

export function useEliminarVenta(): EliminarVentaResult {
  const sales = useSalesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<void, Error, EliminarVentaInput>({
    async mutationFn(input) {
      await sales.delete(input.id);
    },
    async onSuccess(_void, variables) {
      await queryClient.invalidateQueries({ queryKey: ['ventas', businessId, variables.fecha] });
    },
  });
}
