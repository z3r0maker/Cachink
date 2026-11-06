import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { MAX_PRODUCT_IMAGE_BYTES, type Product, type ProductId } from '@xangarro/domain';
import {
  InMemoryProductImagesRepository,
  InMemoryProductsRepository,
  makeNewProduct,
} from '../../testing/src/index.js';
import { CapturarFotoProductoUseCase, QuitarFotoProductoUseCase } from '../src/index.js';

const UNKNOWN = '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as ProductId;

/** Base64 that decodes to exactly `bytes` bytes. */
const webpOf = (bytes: number): string => Buffer.alloc(bytes, 9).toString('base64');

const hasCode = (code: string) => (e: unknown) => (e as { code?: string }).code === code;

describe('CapturarFotoProductoUseCase (M-13)', () => {
  let products: InMemoryProductsRepository;
  let images: InMemoryProductImagesRepository;
  let product: Product;
  let capturar: CapturarFotoProductoUseCase;

  beforeEach(async () => {
    products = new InMemoryProductsRepository();
    images = new InMemoryProductImagesRepository();
    product = await products.create(makeNewProduct());
    capturar = new CapturarFotoProductoUseCase(products, images);
  });

  it('saves the photo as a new row on the product’s business, and it wins', async () => {
    const row = await capturar.execute({
      productoId: product.id,
      bytes: webpOf(30_000),
      width: 512,
      height: 512,
    });
    assert.equal(row.productoId, product.id);
    assert.equal(row.businessId, product.businessId);
    assert.equal(row.mime, 'image/webp');
    assert.deepEqual(await images.latestForProduct(product.id), row);
  });

  it('refuses a product that is not in the catalogue, and writes nothing', async () => {
    await assert.rejects(
      capturar.execute({ productoId: UNKNOWN, bytes: webpOf(10), width: 512, height: 512 }),
      hasCode('PRODUCT_NOT_FOUND'),
    );
    assert.equal(await images.latestForProduct(UNKNOWN), null);
  });

  it('refuses bytes over the row limit, saying how heavy they were', async () => {
    const heavy = MAX_PRODUCT_IMAGE_BYTES + 1;
    await assert.rejects(
      capturar.execute({ productoId: product.id, bytes: webpOf(heavy), width: 512, height: 512 }),
      (e: unknown) =>
        hasCode('PRODUCT_IMAGE_TOO_LARGE')(e) && (e as { bytes: number }).bytes === heavy,
    );
    assert.equal(await images.latestForProduct(product.id), null);
  });

  it('refuses bytes that are not base64, or a size past 512 px, as unreadable', async () => {
    await assert.rejects(
      capturar.execute({ productoId: product.id, bytes: 'no es foto!', width: 512, height: 512 }),
      hasCode('PRODUCT_IMAGE_UNREADABLE'),
    );
    await assert.rejects(
      capturar.execute({ productoId: product.id, bytes: webpOf(10), width: 1024, height: 1024 }),
      hasCode('PRODUCT_IMAGE_UNREADABLE'),
    );
    assert.equal(await images.latestForProduct(product.id), null);
  });
});

describe('QuitarFotoProductoUseCase (M-13)', () => {
  let products: InMemoryProductsRepository;
  let images: InMemoryProductImagesRepository;
  let product: Product;
  let quitar: QuitarFotoProductoUseCase;

  beforeEach(async () => {
    products = new InMemoryProductsRepository();
    images = new InMemoryProductImagesRepository();
    product = await products.create(makeNewProduct());
    quitar = new QuitarFotoProductoUseCase(products, images);
  });

  const conFoto = () =>
    new CapturarFotoProductoUseCase(products, images).execute({
      productoId: product.id,
      bytes: webpOf(2_000),
      width: 512,
      height: 512,
    });

  it('writes a tombstone that wins over the photo', async () => {
    await conFoto();
    const t = await quitar.execute({ productoId: product.id });
    assert.equal(t.bytes, null);
    assert.equal(t.width, null);
    assert.equal(t.height, null);
    assert.equal((await images.latestForProduct(product.id))?.id, t.id);
  });

  it('refuses a product that is not in the catalogue', async () => {
    await assert.rejects(quitar.execute({ productoId: UNKNOWN }), hasCode('PRODUCT_NOT_FOUND'));
  });

  it('refuses a tombstone on a product that never had a photo', async () => {
    await assert.rejects(
      quitar.execute({ productoId: product.id }),
      (e: unknown) =>
        hasCode('PRODUCT_IMAGE_MISSING')(e) &&
        (e as { productoId: string }).productoId === product.id,
    );
    assert.equal(await images.latestForProduct(product.id), null);
  });

  it('refuses a second tombstone once the photo is already gone', async () => {
    await conFoto();
    const first = await quitar.execute({ productoId: product.id });
    await assert.rejects(
      quitar.execute({ productoId: product.id }),
      hasCode('PRODUCT_IMAGE_MISSING'),
    );
    assert.equal((await images.latestForProduct(product.id))?.id, first.id);
  });
});
