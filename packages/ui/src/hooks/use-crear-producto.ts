/**
 * `useCrearProducto` — TanStack mutation wrapping
 * ProductsRepository.create. Invalidates productos +
 * productos-con-stock queries so selects and the Stock screen pick up
 * the new row.
 *
 * UXD-R3: added tipo, seguirStock, precioVenta, atributos fields.
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { CrearProductoUseCase } from '@xangarro/application';
import type {
  BusinessId,
  NewProduct,
  Product,
  ProductColor,
  ProductIcon,
  ProductoTipo,
} from '@xangarro/domain';
import type { Money } from '@xangarro/domain';
import { useInventoryMovementsRepository, useProductsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { estadosKeys } from './query-keys';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_CREAR_PRODUCTO } from '../observability/audit-configs';

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
  readonly colorFondo?: ProductColor;
  readonly usoProducto?: Product['usoProducto'];
  /** Optional product icon for visual identification. */
  readonly icono?: ProductIcon | null;
  /** Optional initial stock quantity. Creates an 'entrada' MovimientoInventario. */
  readonly stockInicial?: number;
}

export type CrearProductoResult = UseMutationResult<Product, Error, CrearProductoInput, unknown>;

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
    colorFondo: input.colorFondo ?? 'white',
    usoProducto: input.usoProducto ?? 'venta',
    icono: input.icono ?? null,
    estadoRevision: 'aprobado' as const,
    businessId: biz,
  };
}

export function useCrearProducto(): CrearProductoResult {
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useAuditedMutation(MUTATION_CREAR_PRODUCTO, {
    async mutationFn(input) {
      if (!businessId) throw new Error('useCrearProducto: no current business');
      // The rules — defaults, validation, the initial-stock entrada — are the
      // use case's, shared with the portal (P-07).
      const product = await new CrearProductoUseCase(products, movements).execute({
        product: buildNewProduct(input, businessId as BusinessId),
        stockInicial: input.stockInicial,
      });
      return product;
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['productos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['movimientos', businessId] }),
        // Review item #9: `stockInicial` writes an entrada movement, and
        // `useBalanceGeneral` values inventory from the current stock
        // snapshot — so a new producto moves the Balance the moment it
        // is created.
        ...estadosKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
    },
  });
}
