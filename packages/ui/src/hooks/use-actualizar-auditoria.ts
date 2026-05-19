/**
 * `useActualizarAuditoria` — mutation to save progress on or finalize
 * an inventory audit.
 *
 * When `estado='finalizada'`, creates inventory adjustment movements for
 * each discrepancy. Otherwise just persists the current count progress.
 *
 * Powers the Auditoría "Conteo" tab (Part C4).
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  today,
  type AuditoriaEstado,
  type AuditoriaInventario,
  type AuditoriaInventarioId,
  type AuditoriaLinea,
  type BusinessId,
} from '@cachink/domain';
import { useAuditoriasInventarioRepository, useInventoryMovementsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { auditoriaKeys } from './query-keys';
import { useEmitDirectorAlert } from './use-emit-director-alert';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_ACTUALIZAR_AUDITORIA } from '../observability/audit-configs';

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

async function persistAuditoria(
  input: ActualizarAuditoriaInput,
  businessId: BusinessId,
  auditoriasRepo: ReturnType<typeof useAuditoriasInventarioRepository>,
  movementsRepo: ReturnType<typeof useInventoryMovementsRepository>,
): Promise<AuditoriaInventario> {
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
    await createAdjustmentMovements(input.lineas, businessId, movementsRepo);
  }

  return updated;
}

async function createAdjustmentMovements(
  lineas: readonly AuditoriaLinea[],
  businessId: BusinessId,
  movementsRepo: ReturnType<typeof useInventoryMovementsRepository>,
): Promise<void> {
  const fecha = today();
  for (const linea of lineas) {
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

function emitDiscrepancyAlert(
  input: ActualizarAuditoriaInput,
  auditoria: AuditoriaInventario,
  emitAlert: ReturnType<typeof useEmitDirectorAlert>,
): void {
  if (input.estado !== 'finalizada') return;
  const discrepancyCount = input.lineas.filter(
    (l) => l.diferencia !== null && l.diferencia !== 0,
  ).length;
  if (discrepancyCount > 0) {
    emitAlert.mutate({
      source: 'auditoria-discrepancia',
      severity: 'warning',
      titleKey: 'notificaciones.auditoriaDiscrepancia',
      message: `La auditoría finalizó con ${discrepancyCount} discrepancias.`,
      actionRoute: '/auditoria',
      metadata: JSON.stringify({ auditoriaId: auditoria.id, discrepancyCount }),
    });
  }
}

export function useActualizarAuditoria(): ActualizarAuditoriaResult {
  const auditoriasRepo = useAuditoriasInventarioRepository();
  const movementsRepo = useInventoryMovementsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const emitAlert = useEmitDirectorAlert();

  return useAuditedMutation(MUTATION_ACTUALIZAR_AUDITORIA, {
    async mutationFn(input) {
      if (!businessId) {
        throw new Error('useActualizarAuditoria: no current business set');
      }
      return persistAuditoria(input, businessId, auditoriasRepo, movementsRepo);
    },
    async onSuccess(auditoria, input) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auditoriaKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['movimientos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
      ]);
      emitDiscrepancyAlert(input, auditoria, emitAlert);
    },
  });
}
