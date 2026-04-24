/**
 * `useCrearProducto` — TanStack mutation wrapping
 * ProductsRepository.create. Invalidates productos +
 * productos-con-stock queries so selects and the Stock screen pick up
 * the new row.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { BusinessId, NewProduct, Product } from '@cachink/domain';
import type { Money } from '@cachink/domain';
import { useProductsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface CrearProductoInput {
  readonly nombre: string;
  readonly sku?: string;
  readonly categoria: Product['categoria'];
  readonly costoUnit: Money;
  readonly unidad: Product['unidad'];
  readonly umbralStockBajo?: number;
}

export type CrearProductoResult = UseMutationResult<Product, Error, CrearProductoInput, unknown>;

export function useCrearProducto(): CrearProductoResult {
  const products = useProductsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<Product, Error, CrearProductoInput>({
    async mutationFn(input) {
      if (!businessId) throw new Error('useCrearProducto: no current business');
      const payload: NewProduct = {
        nombre: input.nombre,
        sku: input.sku?.trim() || undefined,
        categoria: input.categoria,
        costoUnitCentavos: input.costoUnit,
        unidad: input.unidad,
        umbralStockBajo: input.umbralStockBajo,
        businessId: businessId as BusinessId,
      };
      return products.create(payload);
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['productos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
      ]);
    },
  });
}
