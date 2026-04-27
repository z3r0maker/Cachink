/**
 * useInformeMensual tests via the wrapped GenerarInformeMensualUseCase
 * (Slice 3 C24).
 */

import { describe, expect, it } from 'vitest';
import { GenerarInformeMensualUseCase } from '@cachink/application';
import {
  InMemoryBusinessesRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  makeNewExpense,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, DeviceId, IsoDate } from '@cachink/domain';

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;

async function setup(): Promise<{
  useCase: GenerarInformeMensualUseCase;
  businessId: BusinessId;
  sales: InMemorySalesRepository;
  expenses: InMemoryExpensesRepository;
}> {
  const sales = new InMemorySalesRepository(DEV);
  const expenses = new InMemoryExpensesRepository(DEV);
  const businesses = new InMemoryBusinessesRepository(DEV);
  const biz = await businesses.create({
    nombre: 'Test',
    regimenFiscal: 'RESICO',
    isrTasa: 0.3,
  });
  const useCase = new GenerarInformeMensualUseCase(sales, expenses, businesses);
  return { useCase, businessId: biz.id as BusinessId, sales, expenses };
}

describe('GenerarInformeMensualUseCase (surfaced by useInformeMensual)', () => {
  it('rejects a non-"YYYY-MM" yearMonth', async () => {
    const { useCase, businessId } = await setup();
    await expect(useCase.execute({ businessId, yearMonth: '2026-4' })).rejects.toThrow(/YYYY-MM/);
  });

  it('returns an informe with the estado de resultados + categoría breakdowns', async () => {
    const { useCase, businessId, sales, expenses } = await setup();
    await sales.create(
      makeNewSale({
        businessId,
        fecha: '2026-04-10' as IsoDate,
        metodo: 'Efectivo',
        monto: 100_000n,
        categoria: 'Producto',
      }),
    );
    await expenses.create(
      makeNewExpense({
        businessId,
        fecha: '2026-04-10' as IsoDate,
        categoria: 'Renta',
        monto: 30_000n,
      }),
    );
    const informe = await useCase.execute({ businessId, yearMonth: '2026-04' });
    expect(informe.ventas).toHaveLength(1);
    expect(informe.egresos).toHaveLength(1);
    expect(informe.estadoResultados.ingresos).toBe(100_000n);
    expect(informe.ventasPorCategoria.Producto).toBe(100_000n);
    expect(informe.egresosPorCategoria.Renta).toBe(30_000n);
  });

  it('scopes ventas + egresos to the requested month only', async () => {
    const { useCase, businessId, sales } = await setup();
    await sales.create(
      makeNewSale({
        businessId,
        fecha: '2026-03-28' as IsoDate,
        metodo: 'Efectivo',
        monto: 999_999n,
      }),
    );
    const informe = await useCase.execute({ businessId, yearMonth: '2026-04' });
    expect(informe.ventas).toEqual([]);
  });
});
