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

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { today, type AuditoriaInventario, type AuditoriaLinea } from '@cachink/domain';
import {
  useAuditoriasInventarioRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { auditoriaKeys } from './query-keys';

export type CrearAuditoriaResult = UseMutationResult<
  AuditoriaInventario,
  Error,
  void,
  unknown
>;

export function useCrearAuditoria(): CrearAuditoriaResult {
  const auditoriasRepo = useAuditoriasInventarioRepository();
  const productsRepo = useProductsRepository();
  const movementsRepo = useInventoryMovementsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<AuditoriaInventario, Error, void>({
    async mutationFn() {
      if (!businessId) {
        throw new Error('useCrearAuditoria: no current business set');
      }

      const allProducts = await productsRepo.listForBusiness(businessId);
      const products = allProducts.filter((p) => p.seguirStock !== false);

      const lineas: AuditoriaLinea[] = await Promise.all(
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

      return auditoriasRepo.create({
        fecha: today(),
        lineas: JSON.stringify(lineas),
        totalProductos: lineas.length,
        businessId,
      });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: auditoriaKeys.all,
      });
    },
  });
}
