import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate } from '@cachink/domain';
import {
  InMemoryBusinessesRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewBusiness,
  makeNewExpense,
  makeNewSale,
} from '../../testing/src/index.js';
import { GenerarInformeMensualUseCase } from '../src/index.js';

describe('GenerarInformeMensualUseCase', () => {
  let sales: InMemorySalesRepository;
  let expenses: InMemoryExpensesRepository;
  let businesses: InMemoryBusinessesRepository;
  let useCase: GenerarInformeMensualUseCase;
  let businessId: BusinessId;

  beforeEach(async () => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
    useCase = new GenerarInformeMensualUseCase(sales, expenses, businesses);
    const b = await businesses.create(
      makeNewBusiness({
        nombre: 'Test Business',
        regimenFiscal: 'RIF',
        isrTasa: 0.3,
        logoUrl: null,
      }),
    );
    businessId = b.id;
  });

  it('rejects an invalid yearMonth format', async () => {
    await expect(
      useCase.execute({ businessId, yearMonth: '2026/04' }),
    ).rejects.toThrow(/yearMonth/);
  });

  it('rejects when the business does not exist', async () => {
    await expect(
      useCase.execute({
        businessId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as BusinessId,
        yearMonth: '2026-04',
      }),
    ).rejects.toThrow(/no existe/);
  });

  it('returns empty arrays + zero totals for a month with no data', async () => {
    const informe = await useCase.execute({ businessId, yearMonth: '2026-04' });
    expect(informe.ventas).toEqual([]);
    expect(informe.egresos).toEqual([]);
    expect(informe.estadoResultados.ingresos).toBe(0n);
    expect(informe.estadoResultados.utilidadNeta).toBe(0n);
  });

  it('realistic month: aggregates ventas + egresos and computes NIF totals', async () => {
    await sales.create(
      makeNewSale({
        businessId,
        fecha: '2026-04-05' as IsoDate,
        monto: 50_000n,
        categoria: 'Producto',
      }),
    );
    await sales.create(
      makeNewSale({
        businessId,
        fecha: '2026-04-20' as IsoDate,
        monto: 75_000n,
        categoria: 'Servicio',
      }),
    );
    await expenses.create(
      makeNewExpense({
        businessId,
        fecha: '2026-04-10' as IsoDate,
        monto: 20_000n,
        categoria: 'Materia Prima',
      }),
    );
    await expenses.create(
      makeNewExpense({
        businessId,
        fecha: '2026-04-15' as IsoDate,
        monto: 30_000n,
        categoria: 'Renta',
      }),
    );

    const informe = await useCase.execute({ businessId, yearMonth: '2026-04' });
    expect(informe.ventas).toHaveLength(2);
    expect(informe.egresos).toHaveLength(2);
    expect(informe.estadoResultados.ingresos).toBe(125_000n);
    expect(informe.estadoResultados.costoDeVentas).toBe(20_000n);
    expect(informe.estadoResultados.gastosOperativos).toBe(30_000n);
    // utilidadOperativa = 125000 − 20000 − 30000 = 75000
    // isr = 75000 × 0.30 = 22500
    // utilidadNeta = 52500
    expect(informe.estadoResultados.utilidadNeta).toBe(52_500n);
  });

  it('produces per-category breakdowns for ventas and egresos', async () => {
    await sales.create(
      makeNewSale({
        businessId,
        fecha: '2026-04-05' as IsoDate,
        monto: 30_000n,
        categoria: 'Producto',
      }),
    );
    await sales.create(
      makeNewSale({
        businessId,
        fecha: '2026-04-06' as IsoDate,
        monto: 20_000n,
        categoria: 'Producto',
      }),
    );
    await sales.create(
      makeNewSale({
        businessId,
        fecha: '2026-04-07' as IsoDate,
        monto: 10_000n,
        categoria: 'Servicio',
      }),
    );
    await expenses.create(
      makeNewExpense({
        businessId,
        fecha: '2026-04-10' as IsoDate,
        monto: 7_000n,
        categoria: 'Renta',
      }),
    );
    await expenses.create(
      makeNewExpense({
        businessId,
        fecha: '2026-04-11' as IsoDate,
        monto: 3_000n,
        categoria: 'Servicios',
      }),
    );

    const informe = await useCase.execute({ businessId, yearMonth: '2026-04' });
    expect(informe.ventasPorCategoria).toEqual({
      Producto: 50_000n,
      Servicio: 10_000n,
    });
    expect(informe.egresosPorCategoria).toEqual({
      Renta: 7_000n,
      Servicios: 3_000n,
    });
  });

  it('scopes results to the requested month only', async () => {
    await sales.create(
      makeNewSale({ businessId, fecha: '2026-03-30' as IsoDate, monto: 999_999n }),
    );
    await sales.create(
      makeNewSale({ businessId, fecha: '2026-04-01' as IsoDate, monto: 10_000n }),
    );
    await sales.create(
      makeNewSale({ businessId, fecha: '2026-05-01' as IsoDate, monto: 999_999n }),
    );
    const informe = await useCase.execute({ businessId, yearMonth: '2026-04' });
    expect(informe.estadoResultados.ingresos).toBe(10_000n);
  });
});
