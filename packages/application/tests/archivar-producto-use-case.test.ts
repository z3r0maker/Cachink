import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { IsoDate, Product } from '@xangarro/domain';
import {
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  makeNewProduct,
} from '../../testing/src/index.js';
import { ArchivarProductoUseCase } from '../src/index.js';

describe('ArchivarProductoUseCase', () => {
  let products: InMemoryProductsRepository;
  let movements: InMemoryInventoryMovementsRepository;
  let product: Product;
  let archivar: ArchivarProductoUseCase;

  beforeEach(async () => {
    products = new InMemoryProductsRepository();
    movements = new InMemoryInventoryMovementsRepository();
    product = await products.create(makeNewProduct());
    archivar = new ArchivarProductoUseCase(products, movements);
  });

  const entrada = (cantidad: number) =>
    movements.create({
      productoId: product.id,
      fecha: '2026-09-18' as IsoDate,
      tipo: 'entrada',
      cantidad,
      costoUnitCentavos: product.costoUnitCentavos,
      motivo: 'Compra a proveedor',
      businessId: product.businessId,
    });

  it('archives a product with no stock', async () => {
    await archivar.execute({ id: product.id });
    assert.equal(await products.findById(product.id), null);
  });

  it('refuses while units remain, saying how many, and archives nothing', async () => {
    await entrada(4);
    await assert.rejects(
      archivar.execute({ id: product.id }),
      (e: unknown) =>
        (e as { code?: string; stock?: number }).code === 'STOCK_NOT_EMPTY' &&
        (e as { stock?: number }).stock === 4,
    );
    assert.notEqual(await products.findById(product.id), null);
  });

  it('archives anyway when the owner confirms with force', async () => {
    await entrada(4);
    await archivar.execute({ id: product.id, force: true });
    assert.equal(await products.findById(product.id), null);
  });

  it('refuses a product that does not exist, with a typed error', async () => {
    await archivar.execute({ id: product.id });
    await assert.rejects(
      archivar.execute({ id: product.id }),
      (e: unknown) => (e as { code?: string }).code === 'PRODUCT_NOT_FOUND',
    );
  });
});
