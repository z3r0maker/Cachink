/**
 * A barcode names one product (P-44, ADR-150 §2): creating or editing a
 * product with a code another live product of the business already has is
 * refused with `CodigoDuplicadoError`, the other product named. UPC-A and
 * EAN-13 are one code; the product's own code, an archived product's code and
 * another tenant's code don't count.
 */
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import { codigoCanonico, type BusinessId, type ProductId } from '@xangarro/domain';

import { InMemoryProductsRepository, makeNewProduct } from '../../testing/src/index.js';
import {
  CrearProductoUseCase,
  EditarProductoUseCase,
  type CodigosDeProducto,
} from '../src/index.js';

const MIO = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const OTRO = '01HZ8XQN9GZJXV8AKQ5X0C7BJY' as BusinessId;

/** The port as Postgres answers it inside `withTenant`: this tenant's live products. */
function codigosDe(
  products: InMemoryProductsRepository,
  businessId: BusinessId,
): CodigosDeProducto {
  return {
    async conCodigo(clave) {
      const todos = await products.listForBusiness(businessId);
      return todos
        .filter((p) => p.deletedAt === null && codigoCanonico(p.sku) === clave)
        .map((p) => ({ id: p.id, nombre: p.nombre }));
    },
  };
}

const esDuplicado = (nombre: string) => (e: unknown) =>
  (e as { code?: string }).code === 'CODIGO_DUPLICADO' &&
  (e as Error).message === `Ese código ya lo tiene «${nombre}».`;

describe('CrearProductoUseCase with the codes', () => {
  let products: InMemoryProductsRepository;
  let crear: CrearProductoUseCase;

  beforeEach(async () => {
    products = new InMemoryProductsRepository();
    crear = new CrearProductoUseCase(products, undefined, 'manual', codigosDe(products, MIO));
    await products.create(
      makeNewProduct({ nombre: 'Refresco de cola', sku: '012000001772', businessId: MIO }),
    );
  });

  it('saves a product with a code nobody has', async () => {
    const p = await crear.execute({
      product: makeNewProduct({ nombre: 'Agua', sku: '7501055300075', businessId: MIO }),
    });
    assert.equal(p.sku, '7501055300075');
  });

  it('refuses a code another product has, and names it', async () => {
    await assert.rejects(
      crear.execute({
        product: makeNewProduct({ nombre: 'Cola', sku: ' 012000001772 ', businessId: MIO }),
      }),
      esDuplicado('Refresco de cola'),
    );
    assert.equal((await products.listForBusiness(MIO)).length, 1);
  });

  it('refuses the same UPC-A written as an EAN-13', async () => {
    await assert.rejects(
      crear.execute({
        product: makeNewProduct({ nombre: 'Cola', sku: '0012000001772', businessId: MIO }),
      }),
      esDuplicado('Refresco de cola'),
    );
  });

  it('lets an archived product’s code be used again', async () => {
    const archivado = await products.create(
      makeNewProduct({ nombre: 'Viejo', sku: 'ABC-1', businessId: MIO }),
    );
    await products.delete(archivado.id);
    const p = await crear.execute({
      product: makeNewProduct({ nombre: 'Nuevo', sku: 'abc-1', businessId: MIO }),
    });
    assert.equal(p.sku, 'abc-1');
  });

  it('ignores another tenant’s code', async () => {
    await products.create(
      makeNewProduct({ nombre: 'Ajeno', sku: '7501234500018', businessId: OTRO }),
    );
    const p = await crear.execute({
      product: makeNewProduct({ nombre: 'Mío', sku: '7501234500018', businessId: MIO }),
    });
    assert.equal(p.nombre, 'Mío');
  });

  it('checks nothing without a code, or without the port (the phone)', async () => {
    await crear.execute({
      product: makeNewProduct({ nombre: 'Sin código', sku: '', businessId: MIO }),
    });
    const telefono = new CrearProductoUseCase(products);
    const p = await telefono.execute({
      product: makeNewProduct({ nombre: 'Cola', sku: '012000001772', businessId: MIO }),
    });
    assert.equal(p.nombre, 'Cola');
  });
});

describe('EditarProductoUseCase with the codes', () => {
  let products: InMemoryProductsRepository;
  let editar: EditarProductoUseCase;
  let suyo: ProductId;

  beforeEach(async () => {
    products = new InMemoryProductsRepository();
    editar = new EditarProductoUseCase(products, codigosDe(products, MIO));
    await products.create(
      makeNewProduct({ nombre: 'Refresco de cola', sku: '012000001772', businessId: MIO }),
    );
    suyo = (
      await products.create(
        makeNewProduct({ nombre: 'Agua', sku: '7501055300075', businessId: MIO }),
      )
    ).id;
  });

  it('keeps the product’s own code, in either form', async () => {
    const p = await editar.execute({
      id: suyo,
      patch: { sku: '07501055300075', nombre: 'Agua 1 L' },
    });
    assert.equal(p.nombre, 'Agua 1 L');
  });

  it('refuses another product’s code', async () => {
    await assert.rejects(
      editar.execute({ id: suyo, patch: { sku: '0012000001772' } }),
      esDuplicado('Refresco de cola'),
    );
    assert.equal((await products.findById(suyo))?.sku, '7501055300075');
  });

  it('does not look when the patch leaves the code alone', async () => {
    let miradas = 0;
    const contando = new EditarProductoUseCase(products, {
      conCodigo: async () => {
        miradas += 1;
        return [];
      },
    });
    await contando.execute({ id: suyo, patch: { nombre: 'Agua natural' } });
    assert.equal(miradas, 0);
  });
});
