/**
 * `useRegistrarMovimiento` — TanStack mutation wrapping
 * `RegistrarMovimientoInventarioUseCase`. Per ADR-021 the use-case
 * dual-writes an Expense when tipo='entrada', so we invalidate both
 * ['movimientos', businessId] and ['egresos', businessId, fecha] on
 * success. Also invalidates ['productos', businessId] so stock
 * derivations re-compute.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { RegistrarMovimientoInventarioUseCase } from '@cachink/application';
import type { InventoryMovement, NewInventoryMovement } from '@cachink/domain';
import { useExpensesRepository, useInventoryMovementsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export type RegistrarMovimientoResult = UseMutationResult<
  InventoryMovement,
  Error,
  NewInventoryMovement,
  unknown
>;

export function useRegistrarMovimiento(): RegistrarMovimientoResult {
  const movements = useInventoryMovementsRepository();
  const expenses = useExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const useCase = useMemo(
    () => new RegistrarMovimientoInventarioUseCase(movements, expenses),
    [movements, expenses],
  );

  return useMutation<InventoryMovement, Error, NewInventoryMovement>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess(movement) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['movimientos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['egresos', businessId, movement.fecha] }),
      ]);
    },
  });
}
