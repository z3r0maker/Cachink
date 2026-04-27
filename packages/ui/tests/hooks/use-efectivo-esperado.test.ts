/**
 * composeEfectivoEsperado tests (Slice 3 C2). Pure composition — no
 * QueryClient, no React tree. Uses in-memory repos directly.
 */

import { describe, expect, it } from 'vitest';
import {
  InMemoryDayClosesRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  makeNewDayClose,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, DeviceId, IsoDate } from '@cachink/domain';
import { composeEfectivoEsperado } from '../../src/hooks/use-efectivo-esperado';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const TODAY = '2026-04-24' as IsoDate;

describe('composeEfectivoEsperado', () => {
  it('returns ZERO when there are no ventas, egresos, or prior corte', async () => {
    const sales = new InMemorySalesRepository();
    const expenses = new InMemoryExpensesRepository();
    const closes = new InMemoryDayClosesRepository(DEV);
    const result = await composeEfectivoEsperado(sales, expenses, closes, BIZ, TODAY);
    expect(result.esperado).toBe(0n);
  });

  it('sums today Efectivo ventas minus egresos', async () => {
    const sales = new InMemorySalesRepository();
    await sales.create(
      makeNewSale({ fecha: TODAY, businessId: BIZ, metodo: 'Efectivo', monto: 50_000n }),
    );
    await sales.create(
      makeNewSale({ fecha: TODAY, businessId: BIZ, metodo: 'Efectivo', monto: 25_000n }),
    );
    // Non-efectivo ventas don't count toward esperado.
    await sales.create(
      makeNewSale({ fecha: TODAY, businessId: BIZ, metodo: 'Tarjeta', monto: 100_000n }),
    );
    const expenses = new InMemoryExpensesRepository();
    const closes = new InMemoryDayClosesRepository(DEV);
    const result = await composeEfectivoEsperado(sales, expenses, closes, BIZ, TODAY);
    // Expected = 50k + 25k = 75k (tarjeta is excluded by the corte formula).
    expect(result.esperado).toBe(75_000n);
  });

  it('adds the saldoCierreAnterior from the latest prior corte', async () => {
    const sales = new InMemorySalesRepository();
    const expenses = new InMemoryExpensesRepository();
    const closes = new InMemoryDayClosesRepository(DEV);
    await closes.create(
      makeNewDayClose({
        fecha: '2026-04-23' as IsoDate,
        businessId: BIZ,
        efectivoEsperadoCentavos: 100_000n,
        efectivoContadoCentavos: 100_000n,
      }),
    );
    const result = await composeEfectivoEsperado(sales, expenses, closes, BIZ, TODAY);
    expect(result.esperado).toBe(100_000n);
  });

  it('scopes ventas to the requested date (older days are excluded)', async () => {
    const sales = new InMemorySalesRepository();
    await sales.create(
      makeNewSale({
        fecha: '2026-04-23' as IsoDate,
        businessId: BIZ,
        metodo: 'Efectivo',
        monto: 99_999n,
      }),
    );
    const expenses = new InMemoryExpensesRepository();
    const closes = new InMemoryDayClosesRepository(DEV);
    const result = await composeEfectivoEsperado(sales, expenses, closes, BIZ, TODAY);
    expect(result.esperado).toBe(0n);
  });
});
