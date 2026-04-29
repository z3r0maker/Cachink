/**
 * Product fixture builders.
 */

import type {
  BusinessId,
  DeviceId,
  IsoTimestamp,
  NewProduct,
  Product,
  ProductId,
} from '@cachink/domain';
import { newEntityId } from '@cachink/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

export function makeNewProduct(overrides: Partial<NewProduct> = {}): NewProduct {
  return {
    nombre: 'Harina 1kg',
    sku: 'HAR-001',
    categoria: 'Materia Prima',
    costoUnitCentavos: 3_500n,
    unidad: 'kg',
    umbralStockBajo: 5,
    tipo: 'producto',
    seguirStock: true,
    precioVentaCentavos: 4_500n,
    atributos: {},
    businessId: DEFAULT_BIZ,
    ...overrides,
  };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  const id = (overrides.id ?? newEntityId<ProductId>()) as ProductId;
  return {
    id,
    nombre: 'Harina 1kg',
    sku: 'HAR-001',
    categoria: 'Materia Prima',
    costoUnitCentavos: 3_500n,
    unidad: 'kg',
    umbralStockBajo: 5,
    tipo: 'producto',
    seguirStock: true,
    precioVentaCentavos: 4_500n,
    atributos: {},
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as Product;
}
