/**
 * `useCrearAuditoria` — mutation to create a new inventory audit in
 * 'borrador' state.
 *
 * Pre-loads all products, builds `AuditoriaLinea[]` with current
 * `stockSistema` from `sumStock()` per product, and calls
 * `auditoriasInventario.create(...)`.
 *
 * Powers the Auditoría "Conteo" tab (Part C4).
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  today,
  type AuditoriaInventario,
  type AuditoriaLinea,
  type BusinessId,
} from '@cachink/domain';
import {
  useAuditoriasInventarioRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { auditoriaKeys } from './query-keys';
import { useEmitDirectorAlert } from './use-emit-director-alert';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_CREAR_AUDITORIA } from '../observability/audit-configs';

export type CrearAuditoriaResult = UseMutationResult<AuditoriaInventario, Error, void, unknown>;

async function buildLineas(
  productsRepo: ReturnType<typeof useProductsRepository>,
  movementsRepo: ReturnType<typeof useInventoryMovementsRepository>,
  businessId: BusinessId,
): Promise<AuditoriaLinea[]> {
  const allProducts = await productsRepo.listForBusiness(businessId);
  const products = allProducts.filter((p) => p.seguirStock !== false);

  return Promise.all(
    products.map(async (p) => {
      const stockSistema = await movementsRepo.sumStock(p.id);
      return {
        productoId: p.id,
        productoNombre: p.nombre,
        stockSistema,
        stockReal: null,
        diferencia: null,
      };
    }),
  );
}

export function useCrearAuditoria(): CrearAuditoriaResult {
  const auditoriasRepo = useAuditoriasInventarioRepository();
  const productsRepo = useProductsRepository();
  const movementsRepo = useInventoryMovementsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const emitAlert = useEmitDirectorAlert();

  return useAuditedMutation(MUTATION_CREAR_AUDITORIA, {
    async mutationFn() {
      if (!businessId) {
        throw new Error('useCrearAuditoria: no current business set');
      }
      const lineas = await buildLineas(productsRepo, movementsRepo, businessId);
      return auditoriasRepo.create({
        fecha: today(),
        lineas: JSON.stringify(lineas),
        totalProductos: lineas.length,
        businessId,
      });
    },
    async onSuccess(auditoria) {
      await queryClient.invalidateQueries({ queryKey: auditoriaKeys.all });
      emitAlert.mutate({
        source: 'auditoria-pendiente',
        severity: 'info',
        titleKey: 'notificaciones.auditoriaPendiente',
        message: `Se creó una nueva auditoría de inventario con ${auditoria.totalProductos} productos.`,
        actionRoute: '/auditoria',
        metadata: JSON.stringify({ auditoriaId: auditoria.id }),
      });
    },
  });
}
