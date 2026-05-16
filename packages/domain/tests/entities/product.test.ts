import { describe, it, expect } from 'vitest';
import {
  ProductSchema,
  NewProductSchema,
  InventoryCategoryEnum,
  InventoryUnitEnum,
  ProductoTipoEnum,
  ProductColorEnum,
  ProductIconEnum,
  resolveProductIcon,
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
  tipo: 'producto' as const,
  seguirStock: true,
  precioVentaCentavos: 4500n,
  atributos: {},
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

  // --- UXD-R3 new fields ---

  it('accepts a servicio product with seguirStock=false', () => {
    const parsed = ProductSchema.parse({
      ...validProduct,
      tipo: 'servicio',
      seguirStock: false,
    });
    expect(parsed.tipo).toBe('servicio');
    expect(parsed.seguirStock).toBe(false);
  });

  it('rejects a servicio with seguirStock=true', () => {
    expect(() =>
      ProductSchema.parse({
        ...validProduct,
        tipo: 'servicio',
        seguirStock: true,
      }),
    ).toThrow(/seguirStock/);
  });

  it('defaults atributos to empty object when omitted', () => {
    const { atributos: _a, ...rest } = validProduct;
    const parsed = ProductSchema.parse(rest);
    expect(parsed.atributos).toEqual({});
  });

  it('accepts atributos with string values', () => {
    const parsed = ProductSchema.parse({
      ...validProduct,
      atributos: { color: 'rojo', talla: 'M' },
    });
    expect(parsed.atributos).toEqual({ color: 'rojo', talla: 'M' });
  });

  it('rejects an unknown tipo value', () => {
    expect(() =>
      ProductSchema.parse({ ...validProduct, tipo: 'combo' }),
    ).toThrow();
  });

  it('defaults colorFondo to white when omitted', () => {
    const { colorFondo: _c, ...rest } = validProduct;
    const parsed = ProductSchema.parse(rest);
    expect(parsed.colorFondo).toBe('white');
  });

  it('accepts a valid colorFondo value', () => {
    const parsed = ProductSchema.parse({ ...validProduct, colorFondo: 'purple' });
    expect(parsed.colorFondo).toBe('purple');
  });

  it('rejects an unknown colorFondo value', () => {
    expect(() => ProductSchema.parse({ ...validProduct, colorFondo: 'neon' })).toThrow();
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
        precioVentaCentavos: 15_000n,
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });

  it('defaults tipo to producto, seguirStock to true', () => {
    const parsed = NewProductSchema.parse({
      nombre: 'Café de olla',
      categoria: 'Producto Terminado',
      costoUnitCentavos: 2_000n,
      unidad: 'pza',
      precioVentaCentavos: 3_500n,
      businessId: BIZ_ID,
    });
    expect(parsed.tipo).toBe('producto');
    expect(parsed.seguirStock).toBe(true);
    expect(parsed.atributos).toEqual({});
  });

  it('accepts a servicio input with seguirStock=false', () => {
    const parsed = NewProductSchema.parse({
      nombre: 'Corte de cabello',
      categoria: 'Otro',
      costoUnitCentavos: 0n,
      unidad: 'pza',
      tipo: 'servicio',
      seguirStock: false,
      precioVentaCentavos: 15_000n,
      businessId: BIZ_ID,
    });
    expect(parsed.tipo).toBe('servicio');
    expect(parsed.seguirStock).toBe(false);
  });

  it('defaults colorFondo to white', () => {
    const parsed = NewProductSchema.parse({
      nombre: 'Playera algodón',
      categoria: 'Producto Terminado',
      costoUnitCentavos: 12_000n,
      unidad: 'pza',
      precioVentaCentavos: 15_000n,
      businessId: BIZ_ID,
    });
    expect(parsed.colorFondo).toBe('white');
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

describe('ProductoTipoEnum', () => {
  it('enumerates producto and servicio', () => {
    expect(ProductoTipoEnum.options).toEqual(['producto', 'servicio']);
  });
});

describe('ProductColorEnum', () => {
  it('enumerates the eight color options', () => {
    expect(ProductColorEnum.options).toEqual([
      'white', 'yellow', 'green', 'blue', 'pink', 'purple', 'peach', 'gray',
    ]);
  });
});

describe('ProductIconEnum', () => {
  it('accepts valid icon names', () => {
    expect(ProductIconEnum.safeParse('pizza').success).toBe(true);
    expect(ProductIconEnum.safeParse('coffee').success).toBe(true);
    expect(ProductIconEnum.safeParse('wrench').success).toBe(true);
  });

  it('rejects invalid icon names', () => {
    expect(ProductIconEnum.safeParse('not-an-icon').success).toBe(false);
    expect(ProductIconEnum.safeParse('').success).toBe(false);
  });

  it('has at least 60 icons', () => {
    expect(ProductIconEnum.options.length).toBeGreaterThanOrEqual(60);
  });
});

describe('icono field on ProductSchema', () => {
  it('defaults icono to null when omitted', () => {
    const parsed = ProductSchema.parse(validProduct);
    expect(parsed.icono).toBeNull();
  });

  it('accepts a valid icon value', () => {
    const parsed = ProductSchema.parse({ ...validProduct, icono: 'pizza' });
    expect(parsed.icono).toBe('pizza');
  });

  it('accepts null as icono value', () => {
    const parsed = ProductSchema.parse({ ...validProduct, icono: null });
    expect(parsed.icono).toBeNull();
  });

  it('rejects an invalid icon value', () => {
    expect(() => ProductSchema.parse({ ...validProduct, icono: 'invalid' })).toThrow();
  });
});

describe('icono field on NewProductSchema', () => {
  const minInput = {
    nombre: 'Test',
    categoria: 'Otro' as const,
    costoUnitCentavos: 100n,
    unidad: 'pza' as const,
    precioVentaCentavos: 200n,
    businessId: BIZ_ID,
  };

  it('defaults icono to undefined/null when not provided', () => {
    const parsed = NewProductSchema.parse(minInput);
    expect(parsed.icono === null || parsed.icono === undefined).toBe(true);
  });

  it('accepts a valid icon value', () => {
    const parsed = NewProductSchema.parse({ ...minInput, icono: 'coffee' });
    expect(parsed.icono).toBe('coffee');
  });
});

describe('resolveProductIcon', () => {
  it('returns the explicit icon when provided', () => {
    expect(resolveProductIcon('pizza', 'Otro')).toBe('pizza');
  });

  it('returns category default when icono is null', () => {
    expect(resolveProductIcon(null, 'Materia Prima')).toBe('box');
    expect(resolveProductIcon(null, 'Producto Terminado')).toBe('package');
    expect(resolveProductIcon(null, 'Empaque')).toBe('archive');
    expect(resolveProductIcon(null, 'Herramienta')).toBe('wrench');
    expect(resolveProductIcon(null, 'Insumo')).toBe('clipboard-list');
    expect(resolveProductIcon(null, 'Otro')).toBe('tag');
  });

  it('explicit icon overrides category default', () => {
    expect(resolveProductIcon('star', 'Materia Prima')).toBe('star');
  });
});
