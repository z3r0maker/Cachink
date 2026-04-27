/**
 * mergeActividad tests (P1C-M10-T04, S4-C5).
 */

import { describe, expect, it } from 'vitest';
import type { DeviceId, IsoDate } from '@cachink/domain';
import { makeNewExpense, makeNewSale } from '@cachink/testing';
import { InMemoryExpensesRepository, InMemorySalesRepository } from '@cachink/testing';
import { mergeActividad } from '../../src/hooks/use-actividad-reciente';

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;

describe('mergeActividad', () => {
  async function seed(): Promise<{
    ventas: ReturnType<InMemorySalesRepository['findByDate']> extends Promise<infer R> ? R : never;
    egresos: ReturnType<InMemoryExpensesRepository['findByDate']> extends Promise<infer R>
      ? R
      : never;
  }> {
    const salesRepo = new InMemorySalesRepository(DEV);
    const expensesRepo = new InMemoryExpensesRepository(DEV);
    const biz = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as never;
    await salesRepo.create(
      makeNewSale({
        fecha: '2026-04-15' as IsoDate,
        businessId: biz,
        metodo: 'Efectivo',
        monto: 1_000n,
      }),
    );
    await expensesRepo.create(
      makeNewExpense({
        fecha: '2026-04-15' as IsoDate,
        businessId: biz,
        categoria: 'Renta',
        monto: 500n,
      }),
    );
    return {
      ventas: await salesRepo.findByDate('2026-04-15' as IsoDate, biz),
      egresos: await expensesRepo.findByDate('2026-04-15' as IsoDate, biz),
    };
  }

  it('returns an empty list when both inputs are empty', () => {
    expect(mergeActividad([], [], 6)).toEqual([]);
  });

  it('orders by createdAt DESC (newest first)', async () => {
    const { ventas, egresos } = await seed();
    const merged = mergeActividad(ventas, egresos, 10);
    expect(merged.length).toBe(2);
    expect(merged[0]!.createdAt >= merged[1]!.createdAt).toBe(true);
  });

  it('applies the limit', async () => {
    const { ventas, egresos } = await seed();
    const merged = mergeActividad(ventas, egresos, 1);
    expect(merged.length).toBe(1);
  });

  it('tags each entry with its kind', async () => {
    const { ventas, egresos } = await seed();
    const merged = mergeActividad(ventas, egresos, 10);
    const kinds = merged.map((e) => e.kind).sort();
    expect(kinds).toEqual(['egreso', 'venta']);
  });

  it('treats a negative limit as zero', () => {
    expect(mergeActividad([], [], -1)).toEqual([]);
  });
});
