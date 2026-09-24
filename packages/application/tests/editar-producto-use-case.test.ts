import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import type { BusinessId, ProductId } from '@xangarro/domain';

import { InMemoryProductsRepository, makeNewProduct } from '../../testing/src/index.js';
import { EditarProductoUseCase } from '../src/index.js';

const BUSINESS = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const MISSING = '01HZ8XQN9GZJXV8AKQ5X0MISSIN' as ProductId;

const isNotFound = (e: unknown) => (e as { code?: string }).code === 'PRODUCT_NOT_FOUND';

describe('EditarProductoUseCase', () => {
  let products: InMemoryProductsRepository;
  let id: ProductId;

  beforeEach(async () => {
    products = new InMemoryProductsRepository();
    id = (await products.create(makeNewProduct({ nombre: 'Taco de pastor', businessId: BUSINESS })))
      .id;
  });

  it('applies the patch and answers the updated product', async () => {
    const p = await new EditarProductoUseCase(products).execute({
      id,
      patch: { nombre: 'Taco al pastor', precioVentaCentavos: 2_800n },
    });
    assert.equal(p.nombre, 'Taco al pastor');
    assert.equal(p.precioVentaCentavos, 2_800n);
    assert.equal((await products.findById(id))?.nombre, 'Taco al pastor');
  });

  it('a missing product is PRODUCT_NOT_FOUND, in words an owner can read', async () => {
    await assert.rejects(
      new EditarProductoUseCase(products).execute({ id: MISSING, patch: { nombre: 'X' } }),
      (e: unknown) => isNotFound(e) && (e as Error).message === 'Ese producto ya no existe.',
    );
  });

  it('a product that vanishes between read and write is PRODUCT_NOT_FOUND too', async () => {
    const vanishing = Object.create(products) as InMemoryProductsRepository;
    vanishing.update = async () => null;
    await assert.rejects(
      new EditarProductoUseCase(vanishing).execute({ id, patch: { nombre: 'X' } }),
      isNotFound,
    );
  });

  it('a patch that would make the product invalid is refused, and nothing is written', async () => {
    await assert.rejects(
      new EditarProductoUseCase(products).execute({ id, patch: { nombre: '' } }),
      (e: unknown) => (e as Error).name === 'ZodError',
    );
    assert.equal((await products.findById(id))?.nombre, 'Taco de pastor');
  });
});
