/**
 * `useCrearProducto` — TanStack mutation wrapping
 * ProductsRepository.create. Invalidates productos +
 * productos-con-stock queries so selects and the Stock screen pick up
 * the new row.
 *
 * UXD-R3: added tipo, seguirStock, precioVenta, atributos fields.
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type {
  BusinessId,
  IsoDate,
  NewProduct,
  Product,
  ProductColor,
  ProductIcon,
  ProductoTipo,
} from '@cachink/domain';
import type { Money } from '@cachink/domain';
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
    colorFondo: input.colorFondo ?? 'white',
    usoProducto: input.usoProducto ?? 'venta',
    icono: input.icono ?? null,
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
