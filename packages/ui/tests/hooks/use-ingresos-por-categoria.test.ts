/**
 * composeIngresosPorCategoria tests — pure composition function.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { BusinessId, IsoDate } from '@cachink/domain';
import {
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewSale,
} from '@cachink/testing';
import { composeIngresosPorCategoria } from '../../src/hooks/use-ingresos-por-categoria';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('composeIngresosPorCategoria', () => {
  let sales: InMemorySalesRepository;

  beforeEach(() => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
  });

  it('returns empty array when no sales exist', async () => {
    const result = await composeIngresosPorCategoria(sales, BIZ, {
      from: '2026-05-01' as IsoDate,
      to: '2026-05-31' as IsoDate,
    });
    expect(result).toEqual([]);
  });

  it('groups sales by category', async () => {
    await sales.create(
      makeNewSale({ businessId: BIZ, categoria: 'Producto', monto: 3000n, fecha: '2026-05-10' as IsoDate }),
    );
    await sales.create(
      makeNewSale({ businessId: BIZ, categoria: 'Producto', monto: 2000n, fecha: '2026-05-15' as IsoDate }),
    );
    await sales.create(
      makeNewSale({ businessId: BIZ, categoria: 'Servicio' as never, monto: 1000n, fecha: '2026-05-20' as IsoDate }),
    );

    const result = await composeIngresosPorCategoria(sales, BIZ, {
      from: '2026-05-01' as IsoDate,
      to: '2026-05-31' as IsoDate,
    });

    expect(result).toHaveLength(2);
    // Sorted descending by total
    expect(result[0]!.categoria).toBe('Producto');
    expect(result[0]!.total).toBe(5000n);
    expect(result[1]!.categoria).toBe('Servicio');
    expect(result[1]!.total).toBe(1000n);
  });

  it('excludes sales outside the date range', async () => {
    await sales.create(
      makeNewSale({ businessId: BIZ, monto: 1000n, fecha: '2026-04-30' as IsoDate }),
    );
    await sales.create(
      makeNewSale({ businessId: BIZ, monto: 2000n, fecha: '2026-05-01' as IsoDate }),
    );

    const result = await composeIngresosPorCategoria(sales, BIZ, {
      from: '2026-05-01' as IsoDate,
      to: '2026-05-31' as IsoDate,
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.total).toBe(2000n);
  });
});
