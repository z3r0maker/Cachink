/**
 * computeKpis tests (Slice 2 C12).
 */

import { describe, expect, it } from 'vitest';
import type { BusinessId, DeviceId, IsoTimestamp, Product, ProductId } from '@cachink/domain';
import { computeKpis } from '../../src/hooks/use-inventario-kpis';
import type { ProductoConStock } from '../../src/hooks/use-productos-con-stock';

function producto(overrides: Partial<Product> = {}): Product {
  return {
    id: '01JPHK0000000000000000R001' as ProductId,
    nombre: 'Tortilla',
    sku: null,
    categoria: 'Producto Terminado',
    costoUnitCentavos: 100n,
    unidad: 'pza',
    umbralStockBajo: 3,
    businessId: '01JPHK00000000000000000008' as BusinessId,
    deviceId: '01JPHK00000000000000000007' as DeviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
    ...overrides,
  };
}

function row(prod: Product, stock: number): ProductoConStock {
  return { producto: prod, stock };
}

describe('computeKpis', () => {
  it('returns zeros for an empty list', () => {
    expect(computeKpis([])).toEqual({
      totalProductos: 0,
      valorInventario: 0n,
      bajoStockCount: 0,
    });
  });

  it('sums valor = stock × costo per row', () => {
    const items = [
      row(producto({ costoUnitCentavos: 100n }), 10),
      row(producto({ id: '01JPHK0000000000000000R002' as ProductId, costoUnitCentavos: 500n }), 5),
    ];
    const kpis = computeKpis(items);
    expect(kpis.totalProductos).toBe(2);
    expect(kpis.valorInventario).toBe(10n * 100n + 5n * 500n);
  });

  it('counts bajo-stock rows (stock <= umbral)', () => {
    const items = [
      row(producto({ id: '01JPHK0000000000000000R001' as ProductId, umbralStockBajo: 3 }), 1),
      row(producto({ id: '01JPHK0000000000000000R002' as ProductId, umbralStockBajo: 3 }), 3),
      row(producto({ id: '01JPHK0000000000000000R003' as ProductId, umbralStockBajo: 3 }), 5),
    ];
    expect(computeKpis(items).bajoStockCount).toBe(2);
  });
});
