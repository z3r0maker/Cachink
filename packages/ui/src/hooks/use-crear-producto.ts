/**
 * `useCrearProducto` — TanStack mutation wrapping
 * ProductsRepository.create. Invalidates productos +
 * productos-con-stock queries so selects and the Stock screen pick up
 * the new row.
 *
 * UXD-R3: added tipo, seguirStock, precioVenta, atributos fields.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { BusinessId, IsoDate, NewProduct, Product, ProductoTipo } from '@cachink/domain';
import type { Money } from '@cachink/domain';
import { useInventoryMovementsRepository, useProductsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface CrearProductoInput {
  readonly nombre: string;
  readonly sku?: string;
  readonly categoria: Product['categoria'];
  readonly costoUnit: Money;
  readonly unidad: Product['unidad'];
  readonly umbralStockBajo?: number;
  readonly tipo?: ProductoTipo;
  readonly seguirStock?: boolean;
  readonly precioVenta: Money;
  readonly atributos?: Record<string, string>;
  /** Optional initial stock quantity. Creates an 'entrada' MovimientoInventario. */
  readonly stockInicial?: number;
}

export type CrearProductoResult = UseMutationResult<Product, Error, CrearProductoInput, unknown>;

function currentIsoDate(): IsoDate {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}` as IsoDate;
}

function buildNewProduct(input: CrearProductoInput, biz: BusinessId): NewProduct {
  return {
    nombre: input.nombre,
    sku: input.sku?.trim() || undefined,
    categoria: input.categoria,
    costoUnitCentavos: input.costoUnit,
    unidad: input.unidad,
    umbralStockBajo: input.umbralStockBajo,
    tipo: input.tipo ?? 'producto',
    seguirStock: input.seguirStock ?? true,
    precioVentaCentavos: input.precioVenta,
    atributos: input.atributos ?? {},
    businessId: biz,
  };
}

export function useCrearProducto(): CrearProductoResult {
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<Product, Error, CrearProductoInput>({
    async mutationFn(input) {
      if (!businessId) throw new Error('useCrearProducto: no current business');
      const product = await products.create(buildNewProduct(input, businessId as BusinessId));
      if (input.stockInicial !== undefined && input.stockInicial > 0) {
        await movements.create({
          productoId: product.id,
          fecha: currentIsoDate(),
          tipo: 'entrada',
          cantidad: input.stockInicial,
          costoUnitCentavos: input.costoUnit,
          motivo: 'Ajuste de inventario',
          businessId: businessId as BusinessId,
        });
      }
      return product;
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['productos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['movimientos', businessId] }),
      ]);
    },
  });
}
