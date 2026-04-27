/**
 * useExportarDatos contract tests (Slice 3 C22).
 *
 * The hook is a thin wrapper around ExportarDatosUseCase + the
 * useXRepository accessors. We assert the underlying use-case behaviour
 * through the in-memory repos — that's the observable contract the
 * Settings screen relies on.
 */

import { describe, expect, it } from 'vitest';
import { ExportarDatosUseCase } from '@cachink/application';
import {
  InMemoryAppConfigRepository,
  InMemoryBusinessesRepository,
  InMemoryClientPaymentsRepository,
  InMemoryClientsRepository,
  InMemoryDayClosesRepository,
  InMemoryEmployeesRepository,
  InMemoryExpensesRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemoryRecurringExpensesRepository,
  InMemorySalesRepository,
  makeNewClient,
  makeNewSale,
} from '@cachink/testing';
import type { BusinessId, DeviceId } from '@cachink/domain';

const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;

async function setup(): Promise<{
  useCase: ExportarDatosUseCase;
  businessId: BusinessId;
  sales: InMemorySalesRepository;
  clients: InMemoryClientsRepository;
}> {
  const businesses = new InMemoryBusinessesRepository(DEV);
  const sales = new InMemorySalesRepository(DEV);
  const expenses = new InMemoryExpensesRepository(DEV);
  const products = new InMemoryProductsRepository(DEV);
  const movements = new InMemoryInventoryMovementsRepository(DEV);
  const employees = new InMemoryEmployeesRepository(DEV);
  const clients = new InMemoryClientsRepository(DEV);
  const payments = new InMemoryClientPaymentsRepository(DEV);
  const closes = new InMemoryDayClosesRepository(DEV);
  const recurring = new InMemoryRecurringExpensesRepository(DEV);
  void new InMemoryAppConfigRepository(); // keeps the in-memory family explicit

  const biz = await businesses.create({
    nombre: 'Test',
    regimenFiscal: 'RESICO',
    isrTasa: 0.3,
  });
  const useCase = new ExportarDatosUseCase({
    businesses,
    sales,
    expenses,
    products,
    inventoryMovements: movements,
    employees,
    clients,
    clientPayments: payments,
    dayCloses: closes,
    recurringExpenses: recurring,
  });
  return { useCase, businessId: biz.id as BusinessId, sales, clients };
}

describe('ExportarDatosUseCase (surfaced by useExportarDatos)', () => {
  it('returns an empty dataset when the business has no activity', async () => {
    const { useCase, businessId } = await setup();
    const ds = await useCase.execute({ businessId });
    expect(ds.business?.id).toBe(businessId);
    expect(ds.sales).toEqual([]);
    expect(ds.clients).toEqual([]);
  });

  it('threads businessId through every repo — sales live in the returned dataset', async () => {
    const { useCase, businessId, sales } = await setup();
    await sales.create(
      makeNewSale({
        businessId,
        fecha: new Date().toISOString().slice(0, 10) as never,
        monto: 12_345n,
      }),
    );
    const ds = await useCase.execute({ businessId });
    expect(ds.sales).toHaveLength(1);
    expect(ds.sales[0]!.monto).toBe(12_345n);
  });

  it('exports clientes so the workbook can include them', async () => {
    const { useCase, businessId, clients } = await setup();
    await clients.create(makeNewClient({ businessId, nombre: 'Laura' }));
    const ds = await useCase.execute({ businessId });
    expect(ds.clients.map((c) => c.nombre)).toContain('Laura');
  });
});
