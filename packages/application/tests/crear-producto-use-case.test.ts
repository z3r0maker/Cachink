import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { IsoDate } from '@xangarro/domain';
import {
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  makeNewProduct,
} from '../../testing/src/index.js';
import { CrearProductoUseCase } from '../src/index.js';

const TODAY = '2026-09-18' as IsoDate;

describe('CrearProductoUseCase', () => {
  let products: InMemoryProductsRepository;
  let movements: InMemoryInventoryMovementsRepository;

  beforeEach(() => {
    products = new InMemoryProductsRepository();
    movements = new InMemoryInventoryMovementsRepository();
  });

  it('creates the product with the domain defaults and a blank SKU dropped', async () => {
    const {
      tipo: _t,
      seguirStock: _s,
      colorFondo: _c,
      usoProducto: _u,
      ...bare
    } = makeNewProduct({ sku: '   ' });
    const p = await new CrearProductoUseCase(products).execute({ product: bare });
    assert.equal(p.tipo, 'producto');
    assert.equal(p.seguirStock, true);
    assert.equal(p.colorFondo, 'white');
    assert.equal(p.usoProducto, 'venta');
    assert.equal(p.sku ?? null, null);
    assert.equal((await products.listForBusiness(p.businessId)).length, 1);
  });

  it('on the phone, initial stock becomes an entrada at the product cost', async () => {
    const p = await new CrearProductoUseCase(products, movements).execute({
      product: makeNewProduct(),
      stockInicial: 12,
      today: TODAY,
    });
    const [m] = await movements.findByProduct(p.id);
    assert.equal(m?.tipo, 'entrada');
    assert.equal(m?.cantidad, 12);
    assert.equal(m?.costoUnitCentavos, 3_500n);
    assert.equal(m?.fecha, TODAY);
  });

  it('zero initial stock records no movement', async () => {
    const p = await new CrearProductoUseCase(products, movements).execute({
      product: makeNewProduct(),
      stockInicial: 0,
    });
    assert.equal((await movements.findByProduct(p.id)).length, 0);
  });

  it('without a movements store (the portal), initial stock is refused and nothing is created', async () => {
    await assert.rejects(
      new CrearProductoUseCase(products).execute({ product: makeNewProduct(), stockInicial: 5 }),
      (e: unknown) => (e as { code?: string }).code === 'INITIAL_STOCK_NOT_ALLOWED',
    );
    assert.equal((await products.listForBusiness(makeNewProduct().businessId)).length, 0);
  });

  it('refuses an invalid product with a typed error and creates nothing', async () => {
    await assert.rejects(
      new CrearProductoUseCase(products).execute({ product: makeNewProduct({ nombre: '' }) }),
      (e: unknown) => (e as { code?: string }).code === 'PRODUCT_INVALID',
    );
    assert.equal((await products.listForBusiness(makeNewProduct().businessId)).length, 0);
  });

  it('refuses a negative or fractional initial stock', async () => {
    for (const stockInicial of [-1, 1.5]) {
      await assert.rejects(
        new CrearProductoUseCase(products, movements).execute({
          product: makeNewProduct(),
          stockInicial,
        }),
        (e: unknown) => (e as { code?: string }).code === 'PRODUCT_INVALID',
      );
    }
  });
});
