/**
 * `useRegistrarMovimiento` — TanStack mutation wrapping
 * `RegistrarMovimientoInventarioUseCase`. Per ADR-021 the use-case
 * dual-writes an Expense when tipo='entrada', so we invalidate
 * ['movimientos', businessId], ['productos', businessId],
 * ['productos-con-stock', businessId], and
 * ['egresos', businessId, fecha] on success.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { RegistrarMovimientoInventarioUseCase } from '@cachink/application';
import type { InventoryMovement, NewInventoryMovement } from '@cachink/domain';
import { useExpensesRepository, useInventoryMovementsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useAuditedUseCase } from '../observability/index';
import { AUDIT_MOVIMIENTO_INVENTARIO } from '../observability/audit-configs';
import { useEmitDirectorAlert } from './use-emit-director-alert';

export type RegistrarMovimientoResult = UseMutationResult<
  InventoryMovement,
  Error,
  NewInventoryMovement,
  unknown
>;

const MERMA_MOTIVOS = ['Caducidad', 'Daño', 'Preparación incorrecta', 'Otro'];

export function useRegistrarMovimiento(): RegistrarMovimientoResult {
  const movements = useInventoryMovementsRepository();
  const expenses = useExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const emitAlert = useEmitDirectorAlert();
  const rawUseCase = useMemo(
    () => new RegistrarMovimientoInventarioUseCase(movements, expenses),
    [movements, expenses],
  );
  const useCase = useAuditedUseCase(rawUseCase, AUDIT_MOVIMIENTO_INVENTARIO);

  return useMutation<InventoryMovement, Error, NewInventoryMovement>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess(movement) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['movimientos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['egresos', businessId, movement.fecha] }),
      ]);

      // Alert: merma-threshold — if this is a merma exit
      if (
        movement.tipo === 'salida' &&
        movement.motivo &&
        MERMA_MOTIVOS.includes(movement.motivo)
      ) {
        emitAlert.mutate({
          source: 'merma-threshold',
          severity: 'warning',
          titleKey: 'notificaciones.mermaThreshold',
          message: `Se registró merma: ${movement.cantidad} unidades (${movement.motivo}).`,
          actionRoute: '/merma-reportes',
          metadata: JSON.stringify({
            productoId: movement.productoId,
            cantidad: movement.cantidad,
            motivo: movement.motivo,
          }),
          dedupeKey: `merma-${movement.productoId}-${movement.fecha}`,
        });
      }
    },
  });
}
