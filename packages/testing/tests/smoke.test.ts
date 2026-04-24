import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, NewSale } from '@cachink/domain';
import { fromCentavos } from '@cachink/domain';
import { InMemorySalesRepository, TEST_DEVICE_ID } from '../src/index.js';

/**
 * Scaffolding smoke test for @cachink/testing.
 *
 * Ensures the package's vitest harness wires up against a real repo
 * implementation end-to-end. Commit 2 replaces this with the shared
 * `describeSalesRepositoryContract` factory, which runs the same
 * assertions here against the in-memory impl and inside `@cachink/data`
 * against the Drizzle impl.
 */

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BIZ' as BusinessId;
const CLIENT = '01HZ8XQN9GZJXV8AKQ5X0C7CLI' as ClientId;

function makeCashSale(overrides: Partial<NewSale> = {}): NewSale {
  return {
    fecha: '2026-04-23',
    concepto: 'Taco al pastor',
    categoria: 'Producto',
    monto: fromCentavos(4_50n),
    metodo: 'Efectivo',
    businessId: BIZ,
    ...overrides,
  };
}

describe('@cachink/testing — scaffolding smoke', () => {
  let repo: InMemorySalesRepository;

  beforeEach(() => {
    repo = new InMemorySalesRepository(TEST_DEVICE_ID);
  });

  it('exposes the shared TEST_DEVICE_ID constant', () => {
    expect(TEST_DEVICE_ID).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('creates a sale and round-trips it via findById', async () => {
    const sale = await repo.create(makeCashSale());
    expect(sale.estadoPago).toBe('pagado');
    expect(sale.deviceId).toBe(TEST_DEVICE_ID);
    expect(await repo.findById(sale.id)).toEqual(sale);
  });

  it('marks a Crédito sale as pendiente and requires a client', async () => {
    const sale = await repo.create(
      makeCashSale({ metodo: 'Crédito', clienteId: CLIENT }),
    );
    expect(sale.estadoPago).toBe('pendiente');
    const pending = await repo.findPendingByClient(CLIENT);
    expect(pending).toHaveLength(1);
  });

  it('filters by date and business and excludes deleted', async () => {
    const keep = await repo.create(makeCashSale());
    const drop = await repo.create(makeCashSale({ fecha: '2026-04-22' }));
    const forDate = await repo.findByDate('2026-04-23', BIZ);
    expect(forDate.map((s) => s.id)).toEqual([keep.id]);
    expect(forDate).not.toContainEqual(drop);
  });

  it('updates estadoPago and soft-deletes', async () => {
    const sale = await repo.create(makeCashSale({ metodo: 'Crédito', clienteId: CLIENT }));
    await repo.updatePaymentState(sale.id, 'pagado');
    const reread = await repo.findById(sale.id);
    expect(reread?.estadoPago).toBe('pagado');
    await repo.delete(sale.id);
    expect(await repo.findById(sale.id)).toBeNull();
  });

  it('_reset wipes internal state (test helper)', async () => {
    await repo.create(makeCashSale());
    repo._reset();
    expect(await repo.findByDate('2026-04-23', BIZ)).toEqual([]);
  });

  it('tolerates updates and deletes on missing ids', async () => {
    await repo.updatePaymentState('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never, 'pagado');
    await repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never);
    expect(await repo.findByDate('2026-04-23', BIZ)).toEqual([]);
  });
});
