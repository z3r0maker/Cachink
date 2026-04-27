import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ProductId } from '@cachink/domain';
import {
  InMemoryProductsRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
} from '../../testing/src/index.js';
import { EditarProductoUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('EditarProductoUseCase', () => {
  let products: InMemoryProductsRepository;
  let editar: EditarProductoUseCase;

  beforeEach(() => {
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    editar = new EditarProductoUseCase(products);
  });

  it('updates nombre + umbralStockBajo and bumps updatedAt', async () => {
    const producto = await products.create(
      makeNewProduct({ businessId: BIZ, nombre: 'Café', umbralStockBajo: 3 }),
    );
    const updated = await editar.execute({
      id: producto.id,
      patch: { nombre: 'Café tostado oscuro', umbralStockBajo: 8 },
    });
    expect(updated.nombre).toBe('Café tostado oscuro');
    expect(updated.umbralStockBajo).toBe(8);
  });

  it('preserves costoUnitCentavos (not patchable)', async () => {
    const producto = await products.create(
      makeNewProduct({ businessId: BIZ, costoUnitCentavos: 4500n }),
    );
    const updated = await editar.execute({
      id: producto.id,
      patch: { nombre: 'Otro nombre' },
    });
    expect(updated.costoUnitCentavos).toBe(4500n);
  });

  it('throws when the producto does not exist', async () => {
    await expect(
      editar.execute({
        id: '01HZ8XQN9GZJXV8AKQ5X0CZZZZ' as ProductId,
        patch: { nombre: 'X' },
      }),
    ).rejects.toThrow(/no existe/);
  });

  it('Zod rejects an empty nombre', async () => {
    const producto = await products.create(makeNewProduct({ businessId: BIZ }));
    await expect(editar.execute({ id: producto.id, patch: { nombre: '' } })).rejects.toThrow();
  });

  it('Zod rejects a negative umbralStockBajo', async () => {
    const producto = await products.create(makeNewProduct({ businessId: BIZ }));
    await expect(
      editar.execute({ id: producto.id, patch: { umbralStockBajo: -1 } }),
    ).rejects.toThrow();
  });
});
