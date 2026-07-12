/**
 * StockScreen tests — filterProductos pure function + exports.
 */

import { describe, expect, it } from 'vitest';
import type { Product, ProductId, BusinessId, DeviceId, IsoTimestamp } from '@cachink/domain';
import { filterProductos } from '../../src/screens/Inventario/stock-screen';
import type { ProductoConStock } from '../../src/hooks/use-productos-con-stock';

function makeProducto(nombre: string, sku?: string): ProductoConStock {
  return {
    producto: {
      id: `P-${nombre}` as ProductId,
      nombre,
      sku: sku ?? null,
      categoria: 'Producto',
      precio: 1000n,
      costoUnitario: null,
      umbralStockBajo: null,
      barcode: null,
      tipoVenta: 'unidad',
      usoProducto: 'venta',
      iconName: null,
      iconColor: null,
      atributos: {},
      businessId: 'B001' as BusinessId,
      deviceId: 'D001' as DeviceId,
      createdByUserId: null,
      createdAt: '2026-01-01T00:00:00.000Z' as IsoTimestamp,
      updatedAt: '2026-01-01T00:00:00.000Z' as IsoTimestamp,
      deletedAt: null,
    } as Product,
    stock: 10,
  };
}

const ITEMS: ProductoConStock[] = [
  makeProducto('Taco al pastor', 'TAC001'),
  makeProducto('Quesadilla', 'QUE002'),
  makeProducto('Agua mineral'),
];

describe('filterProductos', () => {
  it('returns all items when query is empty', () => {
    expect(filterProductos(ITEMS, '')).toHaveLength(3);
  });

  it('returns all items when query is whitespace', () => {
    expect(filterProductos(ITEMS, '   ')).toHaveLength(3);
  });

  it('filters by nombre (case-insensitive)', () => {
    const result = filterProductos(ITEMS, 'taco');
    expect(result).toHaveLength(1);
    expect(result[0]!.producto.nombre).toBe('Taco al pastor');
  });

  it('filters by SKU', () => {
    const result = filterProductos(ITEMS, 'QUE002');
    expect(result).toHaveLength(1);
    expect(result[0]!.producto.nombre).toBe('Quesadilla');
  });

  it('returns empty array when no match', () => {
    expect(filterProductos(ITEMS, 'xyz')).toHaveLength(0);
  });

  it('matches partial nombre', () => {
    const result = filterProductos(ITEMS, 'pastor');
    expect(result).toHaveLength(1);
  });

  it('handles items without SKU', () => {
    const result = filterProductos(ITEMS, 'agua');
    expect(result).toHaveLength(1);
    expect(result[0]!.producto.nombre).toBe('Agua mineral');
  });
});
