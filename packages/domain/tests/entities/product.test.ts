import { describe, it, expect } from 'vitest';
import {
  ProductSchema,
  NewProductSchema,
  InventoryCategoryEnum,
  InventoryUnitEnum,
} from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const PROD_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEZ';

const validProduct = {
  id: PROD_ID,
  nombre: 'Harina de maíz 1kg',
  sku: 'HAR-001',
  categoria: 'Materia Prima' as const,
  costoUnitCentavos: 3500n,
  unidad: 'kg' as const,
  umbralStockBajo: 5,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

describe('ProductSchema', () => {
  it('accepts a well-formed Product', () => {
    expect(() => ProductSchema.parse(validProduct)).not.toThrow();
  });

  it('accepts a Product with null sku', () => {
    expect(() => ProductSchema.parse({ ...validProduct, sku: null })).not.toThrow();
  });

  it('defaults umbralStockBajo to 3 when omitted', () => {
    const { umbralStockBajo: _u, ...rest } = validProduct;
    const parsed = ProductSchema.parse(rest);
    expect(parsed.umbralStockBajo).toBe(3);
  });

  it('rejects negative umbralStockBajo', () => {
    expect(() => ProductSchema.parse({ ...validProduct, umbralStockBajo: -1 })).toThrow();
  });

  it('rejects a float umbralStockBajo', () => {
    expect(() => ProductSchema.parse({ ...validProduct, umbralStockBajo: 3.5 })).toThrow();
  });

  it('rejects an unknown unidad', () => {
    expect(() => ProductSchema.parse({ ...validProduct, unidad: 'litros' })).toThrow();
  });

  it('rejects an unknown categoria', () => {
    expect(() => ProductSchema.parse({ ...validProduct, categoria: 'Comida' })).toThrow();
  });

  it('rejects an empty nombre', () => {
    expect(() => ProductSchema.parse({ ...validProduct, nombre: '' })).toThrow();
  });
});

describe('NewProductSchema', () => {
  it('accepts a minimal input without sku or umbralStockBajo', () => {
    expect(() =>
      NewProductSchema.parse({
        nombre: 'Playera algodón',
        categoria: 'Producto Terminado',
        costoUnitCentavos: 12_000n,
        unidad: 'pza',
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });
});

describe('Inventory enums', () => {
  it('InventoryCategoryEnum enumerates the six INV_CAT values', () => {
    expect(InventoryCategoryEnum.options).toEqual([
      'Materia Prima',
      'Producto Terminado',
      'Empaque',
      'Herramienta',
      'Insumo',
      'Otro',
    ]);
  });

  it('InventoryUnitEnum enumerates the nine INV_UNIDAD values', () => {
    expect(InventoryUnitEnum.options).toEqual([
      'pza',
      'kg',
      'lt',
      'm',
      'caja',
      'bolsa',
      'rollo',
      'par',
      'otro',
    ]);
  });
});
