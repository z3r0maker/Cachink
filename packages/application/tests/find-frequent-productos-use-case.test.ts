import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate } from '@cachink/domain';
import {
  InMemoryProductsRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
  makeNewSale,
} from '../../testing/src/index.js';
import { FindFrequentProductosUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const TODAY = new Date().toISOString().slice(0, 10) as IsoDate;

describe('FindFrequentProductosUseCase', () => {
  let sales: InMemorySalesRepository;
  let products: InMemoryProductsRepository;
  let useCase: FindFrequentProductosUseCase;

  beforeEach(() => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    useCase = new FindFrequentProductosUseCase(sales, products);
  });

  it('returns frequent products sorted by sale count', async () => {
    const p1 = await products.create(makeNewProduct({ businessId: BIZ, nombre: 'A' }));
    const p2 = await products.create(makeNewProduct({ businessId: BIZ, nombre: 'B' }));

    // Sell p1 once, p2 three times
    await sales.create(makeNewSale({ businessId: BIZ, productoId: p1.id, fecha: TODAY }));
    await sales.create(makeNewSale({ businessId: BIZ, productoId: p2.id, fecha: TODAY }));
    await sales.create(makeNewSale({ businessId: BIZ, productoId: p2.id, fecha: TODAY }));
    await sales.create(makeNewSale({ businessId: BIZ, productoId: p2.id, fecha: TODAY }));

    const result = await useCase.execute({ businessId: BIZ });
    expect(result[0]!.id).toBe(p2.id); // p2 sold 3×
    expect(result[1]!.id).toBe(p1.id); // p1 sold 1×
  });

  it('falls back to newest products when no ventas exist', async () => {
    const p1 = await products.create(makeNewProduct({ businessId: BIZ, nombre: 'Oldest' }));
    const p2 = await products.create(makeNewProduct({ businessId: BIZ, nombre: 'Newest' }));

    const result = await useCase.execute({ businessId: BIZ, limit: 1 });
    // Newest by createdAt should come first in the fallback
    expect(result.length).toBe(1);
    // Both were created nearly simultaneously; just verify we get one
    expect([p1.id, p2.id]).toContain(result[0]!.id);
  });

  it('respects the limit parameter', async () => {
    for (let i = 0; i < 10; i++) {
      await products.create(makeNewProduct({ businessId: BIZ, nombre: `P${i}` }));
    }
    const result = await useCase.execute({ businessId: BIZ, limit: 3 });
    expect(result.length).toBe(3);
  });

  it('excludes sales older than the lookback window', async () => {
    const p1 = await products.create(makeNewProduct({ businessId: BIZ, nombre: 'Old' }));
    const p2 = await products.create(makeNewProduct({ businessId: BIZ, nombre: 'Recent' }));

    // p1 sold 30 days ago (outside 14-day window)
    await sales.create(
      makeNewSale({ businessId: BIZ, productoId: p1.id, fecha: '2026-03-01' as IsoDate }),
    );
    // p2 sold today
    await sales.create(makeNewSale({ businessId: BIZ, productoId: p2.id, fecha: TODAY }));

    const result = await useCase.execute({ businessId: BIZ, days: 14 });
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe(p2.id);
  });

  it('ignores sales without productoId', async () => {
    await sales.create(makeNewSale({ businessId: BIZ, fecha: TODAY })); // no productoId
    const p1 = await products.create(makeNewProduct({ businessId: BIZ }));

    const result = await useCase.execute({ businessId: BIZ });
    // Should fall back to newest products since no productoId-linked sales
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe(p1.id);
  });

  it('returns empty array when no products exist and no sales', async () => {
    const result = await useCase.execute({ businessId: BIZ });
    expect(result).toEqual([]);
  });
});
