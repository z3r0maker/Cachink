/**
 * `useActualizarAuditoria` — mutation to save progress on or finalize
 * an inventory audit.
 *
 * When `estado='finalizada'`, creates inventory adjustment movements for
 * each discrepancy. Otherwise just persists the current count progress.
 *
 * Powers the Auditoría "Conteo" tab (Part C4).
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  today,
  type AuditoriaEstado,
  type AuditoriaInventario,
  type AuditoriaInventarioId,
  type AuditoriaLinea,
} from '@cachink/domain';
import {
  useAuditoriasInventarioRepository,
  useInventoryMovementsRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { auditoriaKeys } from './query-keys';

export interface ActualizarAuditoriaInput {
  readonly id: AuditoriaInventarioId;
  readonly lineas: readonly AuditoriaLinea[];
  readonly estado: AuditoriaEstado;
}

export type ActualizarAuditoriaResult = UseMutationResult<
  AuditoriaInventario,
  Error,
  ActualizarAuditoriaInput,
  unknown
>;

export function useActualizarAuditoria(): ActualizarAuditoriaResult {
  const auditoriasRepo = useAuditoriasInventarioRepository();
  const movementsRepo = useInventoryMovementsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<AuditoriaInventario, Error, ActualizarAuditoriaInput>({
    async mutationFn(input) {
      if (!businessId) {
        throw new Error('useActualizarAuditoria: no current business set');
      }

      const contados = input.lineas.filter((l) => l.stockReal !== null).length;
      const discrepancias = input.lineas.filter(
        (l) => l.diferencia !== null && l.diferencia !== 0,
      ).length;

      const updated = await auditoriasRepo.update(input.id, {
        lineas: JSON.stringify(input.lineas),
        productosContados: contados,
        totalDiscrepancias: discrepancias,
        estado: input.estado,
      });

      if (input.estado === 'finalizada') {
        const fecha = today();
        for (const linea of input.lineas) {
          if (linea.diferencia === null || linea.diferencia === 0) continue;
          const tipo = linea.diferencia > 0 ? 'entrada' : 'salida';
          await movementsRepo.create({
            productoId: linea.productoId,
            fecha,
            tipo,
            cantidad: Math.abs(linea.diferencia),
            costoUnitCentavos: 0n,
            motivo: 'Ajuste de inventario',
            businessId,
          });
        }
      }

      return updated;
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: auditoriaKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: ['movimientos', businessId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['productos-con-stock', businessId],
        }),
      ]);
    },
  });
}
