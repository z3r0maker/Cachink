import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate } from '@cachink/domain';
import {
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
  TEST_DEVICE_ID,
  makeNewBusiness,
  makeNewClient,
  makeNewClientPayment,
  makeNewDayClose,
  makeNewEmployee,
  makeNewExpense,
  makeNewInventoryMovement,
  makeNewProduct,
  makeNewRecurringExpense,
  makeNewSale,
} from '../../testing/src/index.js';
import { ExportarDatosUseCase } from '../src/index.js';

describe('ExportarDatosUseCase', () => {
  let businessId: BusinessId;
  let useCase: ExportarDatosUseCase;

  let businesses: InMemoryBusinessesRepository;
  let sales: InMemorySalesRepository;
  let expenses: InMemoryExpensesRepository;
  let products: InMemoryProductsRepository;
  let inventoryMovements: InMemoryInventoryMovementsRepository;
  let employees: InMemoryEmployeesRepository;
  let clients: InMemoryClientsRepository;
  let clientPayments: InMemoryClientPaymentsRepository;
  let dayCloses: InMemoryDayClosesRepository;
  let recurringExpenses: InMemoryRecurringExpensesRepository;

  beforeEach(async () => {
    businesses = new InMemoryBusinessesRepository(TEST_DEVICE_ID);
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    inventoryMovements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    employees = new InMemoryEmployeesRepository(TEST_DEVICE_ID);
    clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
    clientPayments = new InMemoryClientPaymentsRepository(TEST_DEVICE_ID);
    dayCloses = new InMemoryDayClosesRepository(TEST_DEVICE_ID);
    recurringExpenses = new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);

    useCase = new ExportarDatosUseCase({
      businesses,
      sales,
      expenses,
      products,
      inventoryMovements,
      employees,
      clients,
      clientPayments,
      dayCloses,
      recurringExpenses,
    });

    const b = await businesses.create(makeNewBusiness({ nombre: 'Export Co' }));
    businessId = b.id;
  });

  it('returns an empty dataset (minus business) when no rows exist', async () => {
    const ds = await useCase.execute({ businessId });
    expect(ds.business?.nombre).toBe('Export Co');
    expect(ds.sales).toEqual([]);
    expect(ds.expenses).toEqual([]);
    expect(ds.products).toEqual([]);
    expect(ds.inventoryMovements).toEqual([]);
    expect(ds.employees).toEqual([]);
    expect(ds.clients).toEqual([]);
    expect(ds.clientPayments).toEqual([]);
    expect(ds.dayCloses).toEqual([]);
    expect(ds.recurringExpenses).toEqual([]);
  });

  it('collects every populated entity for the business', async () => {
    const sale = await sales.create(
      makeNewSale({ businessId, fecha: '2026-04-23' as IsoDate }),
    );
    await expenses.create(
      makeNewExpense({ businessId, fecha: '2026-04-23' as IsoDate }),
    );
    const product = await products.create(makeNewProduct({ businessId }));
    await inventoryMovements.create(
      makeNewInventoryMovement({ businessId, productoId: product.id, fecha: '2026-04-23' as IsoDate }),
    );
    await employees.create(makeNewEmployee({ businessId }));
    await clients.create(makeNewClient({ businessId }));
    await clientPayments.create(
      makeNewClientPayment({ businessId, ventaId: sale.id }),
    );
    await dayCloses.create(
      makeNewDayClose({ businessId, fecha: '2026-04-23' as IsoDate }),
    );
    await recurringExpenses.create(makeNewRecurringExpense({ businessId }));

    const ds = await useCase.execute({ businessId });
    expect(ds.sales.length).toBe(1);
    expect(ds.expenses.length).toBe(1);
    expect(ds.products.length).toBe(1);
    expect(ds.inventoryMovements.length).toBe(1);
    expect(ds.employees.length).toBe(1);
    expect(ds.clients.length).toBe(1);
    expect(ds.clientPayments.length).toBe(1);
    expect(ds.dayCloses.length).toBe(1);
    expect(ds.recurringExpenses.length).toBe(1);
  });

  it('business = null when the business does not exist; other lists empty', async () => {
    const ds = await useCase.execute({
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as BusinessId,
    });
    expect(ds.business).toBeNull();
    expect(ds.sales).toEqual([]);
  });

  it('does not leak rows from another business', async () => {
    const other = await businesses.create(makeNewBusiness({ nombre: 'Other Co' }));
    await sales.create(
      makeNewSale({ businessId: other.id, fecha: '2026-04-23' as IsoDate }),
    );
    await sales.create(
      makeNewSale({ businessId, fecha: '2026-04-23' as IsoDate }),
    );
    const ds = await useCase.execute({ businessId });
    expect(ds.sales.length).toBe(1);
    expect(ds.sales[0]?.businessId).toBe(businessId);
  });
});
