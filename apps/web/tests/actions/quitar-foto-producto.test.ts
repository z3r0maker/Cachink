import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';
import { ProductImageMissingError, ProductNotFoundError } from '@xangarro/domain';

/**
 * «Quitar foto» from the portal (P-42). The rule is the use case's, tested in
 * @xangarro/application and shared with the phone; this action owns the role
 * check, the tenant transaction and the sentence the owner reads when the use
 * case refuses.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
const execute = vi.fn();
const built = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/db', () => ({
  withTenant: (biz: string, fn: (tx: unknown) => unknown) => fn({ tx: biz }),
}));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('../../src/server/repositories/products', () => ({
  pgProductsRepository: (tx: unknown) => ({ products: tx }),
}));
vi.mock('../../src/server/repositories/product-images', () => ({
  pgProductImagesRepository: (tx: unknown) => ({ images: tx }),
}));
vi.mock('@xangarro/application', () => ({
  QuitarFotoProductoUseCase: class {
    constructor(...repos: unknown[]) {
      built(...repos);
    }
    execute = execute;
  },
}));

const { quitarFotoProducto } = await import('../../src/server/actions/quitar-foto-producto');

const PRODUCT = '01HZ8XQN9GZJXV8AKQ5X0PHRC1';

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1' });
  execute.mockResolvedValue({});
});

describe('quitarFotoProducto', () => {
  it('runs the shared use case over both repositories in the tenant, and refreshes Productos', async () => {
    assert.deepEqual(await quitarFotoProducto(PRODUCT), { ok: true });
    assert.deepEqual(requireMember.mock.calls[0], ['admin']);
    assert.deepEqual(built.mock.calls[0], [
      { products: { tx: 'biz-1' } },
      { images: { tx: 'biz-1' } },
    ]);
    assert.deepEqual(execute.mock.calls[0]?.[0], { productoId: PRODUCT });
    assert.deepEqual(revalidatePath.mock.calls, [['/productos']]);
  });

  it('a photo already removed says so in its own words and is not reported', async () => {
    execute.mockRejectedValue(new ProductImageMissingError(PRODUCT));
    assert.deepEqual(await quitarFotoProducto(PRODUCT), {
      ok: false,
      message: 'Este producto no tiene foto.',
    });
    assert.equal(reportError.mock.calls.length, 0);
    assert.equal(revalidatePath.mock.calls.length, 0);
  });

  it('a product deleted meanwhile says so, without its id', async () => {
    execute.mockRejectedValue(new ProductNotFoundError(PRODUCT));
    const r = await quitarFotoProducto(PRODUCT);
    assert.equal(r.ok, false);
    assert.doesNotMatch(r.ok ? '' : r.message, /01HZ/);
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a viewer is refused before any transaction', async () => {
    requireMember.mockRejectedValue(Object.assign(new Error('x'), { code: 'NOT_PERMITTED' }));
    const r = await quitarFotoProducto(PRODUCT);
    assert.equal(r.ok, false);
    assert.equal(built.mock.calls.length, 0);
  });

  it('anything else is reported and answers the retry line', async () => {
    execute.mockRejectedValue(new Error('connection reset'));
    assert.deepEqual(await quitarFotoProducto(PRODUCT), {
      ok: false,
      message: 'No pudimos quitar la foto. Intenta de nuevo.',
    });
    assert.equal(reportError.mock.calls.length, 1);
  });
});
