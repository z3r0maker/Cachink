/**
 * composeEstadoResultados + monthsInRange + collectExpensesInRange tests
 * (Slice 3 C10).
 */

import { describe, expect, it } from 'vitest';
import {
  InMemoryBusinessesRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  makeNewExpense,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, DeviceId, IsoDate } from '@cachink/domain';
import {
  collectExpensesInRange,
  composeEstadoResultados,
  monthsInRange,
} from '../../src/hooks/use-estado-resultados';

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;

describe('monthsInRange', () => {
  it('enumerates a single month for an in-month range', () => {
    expect(monthsInRange('2026-04-10' as IsoDate, '2026-04-20' as IsoDate)).toEqual(['2026-04']);
  });

  it('spans across months', () => {
    expect(monthsInRange('2026-04-20' as IsoDate, '2026-05-10' as IsoDate)).toEqual([
      '2026-04',
      '2026-05',
    ]);
  });

  it('spans across years', () => {
    expect(monthsInRange('2025-11-01' as IsoDate, '2026-02-28' as IsoDate)).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
  });
});

describe('collectExpensesInRange + composeEstadoResultados', () => {
  async function setup(isrTasa = 0.3): Promise<{
    sales: InMemorySalesRepository;
    expenses: InMemoryExpensesRepository;
    businesses: InMemoryBusinessesRepository;
    businessId: BusinessId;
  }> {
    const sales = new InMemorySalesRepository(DEV);
    const expenses = new InMemoryExpensesRepository(DEV);
    const businesses = new InMemoryBusinessesRepository(DEV);
    const biz = await businesses.create({
      nombre: 'Test',
      regimenFiscal: 'RESICO',
      isrTasa,
    });
    return { sales, expenses, businesses, businessId: biz.id };
  }

  it('returns all zeros for an empty period', async () => {
    const { sales, expenses, businesses, businessId } = await setup();
    const estado = await composeEstadoResultados(sales, expenses, businesses, businessId, {
      from: '2026-04-01' as IsoDate,
      to: '2026-04-30' as IsoDate,
    });
    expect(estado.ingresos).toBe(0n);
    expect(estado.utilidadNeta).toBe(0n);
  });

  it('threads isrTasa from the business record into the calc', async () => {
    const { sales, expenses, businesses, businessId } = await setup(0.1);
    await sales.create(
      makeNewSale({
        fecha: '2026-04-10' as IsoDate,
        businessId,
        metodo: 'Efectivo',
        monto: 1_000_00n,
      }),
    );
    const estado = await composeEstadoResultados(sales, expenses, businesses, businessId, {
      from: '2026-04-01' as IsoDate,
      to: '2026-04-30' as IsoDate,
    });
    expect(estado.ingresos).toBe(100_000n);
    expect(estado.isr).toBe(10_000n); // 10% of utilidad operativa = 10k
    expect(estado.utilidadNeta).toBe(90_000n);
  });

  it('clamps ISR to 0 on loss periods', async () => {
    const { sales, expenses, businesses, businessId } = await setup(0.3);
    await expenses.create(
      makeNewExpense({
        fecha: '2026-04-10' as IsoDate,
        businessId,
        categoria: 'Renta',
        monto: 100_000n,
      }),
    );
    const estado = await composeEstadoResultados(sales, expenses, businesses, businessId, {
      from: '2026-04-01' as IsoDate,
      to: '2026-04-30' as IsoDate,
    });
    expect(estado.utilidadOperativa).toBe(-100_000n);
    expect(estado.isr).toBe(0n);
    expect(estado.utilidadNeta).toBe(-100_000n);
  });

  it('collectExpensesInRange trims out-of-range egresos from a month scan', async () => {
    const { expenses, businessId } = await setup();
    // Within range.
    await expenses.create(
      makeNewExpense({
        fecha: '2026-04-15' as IsoDate,
        businessId,
        monto: 100n,
      }),
    );
    // Same month as the boundary, but before `from`.
    await expenses.create(
      makeNewExpense({
        fecha: '2026-04-05' as IsoDate,
        businessId,
        monto: 999n,
      }),
    );
    const rows = await collectExpensesInRange(expenses, businessId, {
      from: '2026-04-10' as IsoDate,
      to: '2026-04-20' as IsoDate,
    });
    expect(rows.map((r) => Number(r.monto))).toEqual([100]);
  });

  it('spans multiple months end-to-end', async () => {
    const { sales, expenses, businesses, businessId } = await setup(0);
    await sales.create(
      makeNewSale({
        fecha: '2026-03-28' as IsoDate,
        businessId,
        metodo: 'Efectivo',
        monto: 50_000n,
      }),
    );
    await sales.create(
      makeNewSale({
        fecha: '2026-04-02' as IsoDate,
        businessId,
        metodo: 'Efectivo',
        monto: 20_000n,
      }),
    );
    const estado = await composeEstadoResultados(sales, expenses, businesses, businessId, {
      from: '2026-03-25' as IsoDate,
      to: '2026-04-05' as IsoDate,
    });
    expect(estado.ingresos).toBe(70_000n);
  });
});
