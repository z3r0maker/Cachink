import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';
import { ProductNotFoundError, ProductSchema } from '@xangarro/domain';

/**
 * Editing a product from the portal. The rules are the use case's (tested in
 * @xangarro/application); what this action owns is the sentence the owner
 * reads when one refuses — never a schema dump, never an internal id.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
const execute = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) => fn({ tx: true }),
}));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('../../src/server/repositories/products', () => ({ pgProductsRepository: vi.fn() }));
vi.mock('@xangarro/application', () => ({
  EditarProductoUseCase: class {
    execute = execute;
  },
}));

const { editarProducto } = await import('../../src/server/actions/editar-producto');

/** The ZodError the use case throws for a patch that breaks the product. */
function zodErrorFor(patch: Record<string, unknown>): unknown {
  const valid = {
    id: '01HZ8XQN9GZJXV8AKQ5X0PTAC1',
    nombre: 'Taco',
    sku: 'TAC-1',
    categoria: 'Producto Terminado',
    costoUnitCentavos: 100n,
    unidad: 'pza',
    umbralStockBajo: 3,
    tipo: 'producto',
    seguirStock: true,
    precioVentaCentavos: 2_500n,
  };
  const r = ProductSchema.safeParse({ ...valid, ...patch });
  assert.equal(r.success, false);
  return r.error;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1' });
  execute.mockResolvedValue({});
});

describe('editarProducto', () => {
  it('saves as an admin and refreshes Productos', async () => {
    assert.deepEqual(await editarProducto('p-1', { nombre: 'Taco al pastor' }), { ok: true });
    assert.deepEqual(requireMember.mock.calls[0], ['admin']);
    assert.deepEqual(execute.mock.calls[0]?.[0], {
      id: 'p-1',
      patch: { nombre: 'Taco al pastor' },
    });
    assert.deepEqual(revalidatePath.mock.calls, [['/productos']]);
  });

  it('a blank name reads as the form reads it, not as a schema dump, and is not reported', async () => {
    execute.mockRejectedValue(zodErrorFor({ nombre: '' }));
    assert.deepEqual(await editarProducto('p-1', { nombre: '' }), {
      ok: false,
      message: 'Escribe el nombre del producto.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('any other invalid field gets a sentence, never the validator’s JSON', async () => {
    execute.mockRejectedValue(zodErrorFor({ umbralStockBajo: -1 }));
    const r = await editarProducto('p-1', { umbralStockBajo: -1 } as never);
    assert.equal(r.ok, false);
    assert.doesNotMatch(r.ok ? '' : r.message, /[[{"]/);
  });

  it('a product deleted meanwhile says so, without its id', async () => {
    execute.mockRejectedValue(new ProductNotFoundError('01HZ8XQN9GZJXV8AKQ5X0PTAC1'));
    assert.deepEqual(await editarProducto('p-1', { nombre: 'X' }), {
      ok: false,
      message: 'Ese producto ya no existe.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a viewer is told why; an outage is reported behind the retry message', async () => {
    requireMember.mockRejectedValueOnce(
      Object.assign(new Error('No tienes permiso.'), { code: 'NOT_PERMITTED' }),
    );
    assert.deepEqual(await editarProducto('p-1', {}), { ok: false, message: 'No tienes permiso.' });
    const pg = new Error('deadlock detected');
    execute.mockRejectedValue(pg);
    assert.deepEqual(await editarProducto('p-1', {}), {
      ok: false,
      message: 'No pudimos guardar el producto. Intenta de nuevo.',
    });
    assert.deepEqual(reportError.mock.calls, [[pg, { endpoint: 'editarProducto' }]]);
  });
});
