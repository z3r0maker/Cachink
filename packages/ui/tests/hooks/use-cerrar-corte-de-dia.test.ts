/**
 * useCerrarCorteDeDia contract tests (Slice 3 C4).
 *
 * Two dimensions are exercised here:
 *   1. The underlying CerrarCorteDeDiaUseCase persists a DayClose with
 *      the derived esperado + diferencia (sanity check that the hook is
 *      wrapping the right use-case).
 *   2. The query-keys factory enumerates every downstream surface the
 *      mutation must invalidate — the hook's `onSuccess` references the
 *      same raw tuples, so the factory stays the source of truth for
 *      the "don't drift" guardrail flagged in query-keys.ts.
 */

import { describe, expect, it } from 'vitest';
import { CerrarCorteDeDiaUseCase } from '@cachink/application';
import {
  InMemoryDayClosesRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, DeviceId, IsoDate, Money } from '@cachink/domain';
import { corteKeys } from '../../src/hooks/query-keys';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const TODAY = '2026-04-24' as IsoDate;

describe('CerrarCorteDeDiaUseCase (wrapped by useCerrarCorteDeDia)', () => {
  it('persists a DayClose with diferencia derived from contado - esperado', async () => {
    const sales = new InMemorySalesRepository();
    await sales.create(
      makeNewSale({ fecha: TODAY, businessId: BIZ, metodo: 'Efectivo', monto: 45000n as Money }),
    );
    const expenses = new InMemoryExpensesRepository();
    const closes = new InMemoryDayClosesRepository(DEV);
    const useCase = new CerrarCorteDeDiaUseCase(sales, expenses, closes);

    const saved = await useCase.execute({
      fecha: TODAY,
      businessId: BIZ,
      deviceId: DEV,
      efectivoContadoCentavos: 40000n,
      explicacion: 'Propina dada',
      cerradoPor: 'Operativo',
    });

    expect(saved.efectivoEsperadoCentavos).toBe(45000n);
    expect(saved.efectivoContadoCentavos).toBe(40000n);
    expect(saved.diferenciaCentavos).toBe(-5000n);
    expect(saved.explicacion).toBe('Propina dada');
  });

  it('refuses to create a second corte for the same fecha + device', async () => {
    const sales = new InMemorySalesRepository();
    const expenses = new InMemoryExpensesRepository();
    const closes = new InMemoryDayClosesRepository(DEV);
    const useCase = new CerrarCorteDeDiaUseCase(sales, expenses, closes);

    await useCase.execute({
      fecha: TODAY,
      businessId: BIZ,
      deviceId: DEV,
      efectivoContadoCentavos: 0n,
      cerradoPor: 'Operativo',
    });
    await expect(
      useCase.execute({
        fecha: TODAY,
        businessId: BIZ,
        deviceId: DEV,
        efectivoContadoCentavos: 0n,
        cerradoPor: 'Operativo',
      }),
    ).rejects.toThrow();
  });
});

describe('corteKeys factory', () => {
  it('enumerates the four surfaces the mutation must invalidate', () => {
    const deps = corteKeys.dependentsForBusiness(BIZ);
    expect(deps).toHaveLength(4);
    expect(deps[0]).toEqual(['corte-del-dia', BIZ]);
    expect(deps[1]).toEqual(['corte-historial', BIZ]);
    expect(deps[2]).toEqual(['efectivo-esperado', BIZ]);
    expect(deps[3]).toEqual(['balance-general', BIZ]);
  });

  it('threads fecha through the efectivo-esperado key so per-day cache is scoped', () => {
    expect(corteKeys.efectivoEsperado(BIZ, TODAY)).toEqual(['efectivo-esperado', BIZ, TODAY]);
  });

  it('returns stable del-dia + historial keys scoped to business', () => {
    expect(corteKeys.delDia(BIZ)).toEqual(['corte-del-dia', BIZ]);
    expect(corteKeys.historial(BIZ)).toEqual(['corte-historial', BIZ]);
  });
});
