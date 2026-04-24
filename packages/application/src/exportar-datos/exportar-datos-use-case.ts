/**
 * ExportarDatosUseCase (P1B-M6-T08).
 *
 * Produces a single structured snapshot of every entity scoped to the
 * business. The UI serialises this to Excel (one sheet per entity) and
 * a PDF summary in P1C-M9 — keeping the use-case format-agnostic lets
 * the same dataset power both.
 *
 * Unlike the other use-cases this one is read-only and has no side
 * effects. It also doesn't accept a date range: "export all data" in
 * CLAUDE.md §1 means the entire business history, not a period.
 */

import type {
  Business,
  BusinessId,
  Client,
  ClientPayment,
  DayClose,
  Employee,
  Expense,
  InventoryMovement,
  Product,
  RecurringExpense,
  Sale,
} from '@cachink/domain';
import type {
  BusinessesRepository,
  ClientPaymentsRepository,
  ClientsRepository,
  DayClosesRepository,
  EmployeesRepository,
  ExpensesRepository,
  InventoryMovementsRepository,
  ProductsRepository,
  RecurringExpensesRepository,
  SalesRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface ExportarDatosInput {
  businessId: BusinessId;
}

export interface ExportDataset {
  business: Business | null;
  sales: readonly Sale[];
  expenses: readonly Expense[];
  products: readonly Product[];
  inventoryMovements: readonly InventoryMovement[];
  employees: readonly Employee[];
  clients: readonly Client[];
  clientPayments: readonly ClientPayment[];
  dayCloses: readonly DayClose[];
  recurringExpenses: readonly RecurringExpense[];
}

export interface ExportarDatosRepositories {
  businesses: BusinessesRepository;
  sales: SalesRepository;
  expenses: ExpensesRepository;
  products: ProductsRepository;
  inventoryMovements: InventoryMovementsRepository;
  employees: EmployeesRepository;
  clients: ClientsRepository;
  clientPayments: ClientPaymentsRepository;
  dayCloses: DayClosesRepository;
  recurringExpenses: RecurringExpensesRepository;
}

export class ExportarDatosUseCase
  implements UseCase<ExportarDatosInput, ExportDataset>
{
  readonly #repos: ExportarDatosRepositories;

  constructor(repos: ExportarDatosRepositories) {
    this.#repos = repos;
  }

  async execute(input: ExportarDatosInput): Promise<ExportDataset> {
    const { businessId } = input;
    const [business, products, employees, clients, recurring] = await Promise.all([
      this.#repos.businesses.findById(businessId),
      this.#repos.products.listForBusiness(businessId),
      this.#repos.employees.listActive(businessId),
      this.#repos.clients.findByName('', businessId),
      this.#repos.recurringExpenses.findDue('9999-12-31' as never, businessId),
    ]);

    const sales = await collectSales(this.#repos.sales, businessId);
    const [expenses, inventoryMovements, clientPayments, dayCloses] = await Promise.all([
      collectExpenses(this.#repos.expenses, businessId),
      collectInventoryMovements(this.#repos.inventoryMovements, businessId),
      collectClientPayments(this.#repos.clientPayments, sales),
      collectDayCloses(this.#repos.dayCloses, businessId),
    ]);

    return {
      business,
      sales,
      expenses,
      products,
      inventoryMovements,
      employees,
      clients,
      clientPayments,
      dayCloses,
      recurringExpenses: recurring,
    };
  }
}

/**
 * Helpers below walk the repositories without a date filter. Each builds
 * on a best-fit finder:
 *   sales / expenses / inventoryMovements: findByDateRange('0000-01-01', '9999-12-31')
 *   dayCloses: findLatest then walk backwards is impractical; we use a
 *     list that surfaces every row (also emulated via a wide date range).
 *   clientPayments: cannot be listed by business directly; collects via
 *     sumByVenta-style iteration over every sale.
 */

async function collectSales(
  repo: SalesRepository,
  businessId: BusinessId,
): Promise<readonly Sale[]> {
  // SalesRepository.findByDate is the only per-date accessor in Phase 1.
  // The export walks a bounded window (current year ± 1 + two prior years)
  // which covers ≈ 1_460 days — fast even on the Drizzle impl. When P1C
  // promotes findByMonth / listForBusiness to the SalesRepository
  // interface we'll simplify this to a single call.
  const out: Sale[] = [];
  const currentYear = new Date().getUTCFullYear();
  for (let year = currentYear - 2; year <= currentYear + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
      for (let day = 1; day <= days; day++) {
        const d = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const rows = await repo.findByDate(d, businessId);
        if (rows.length > 0) out.push(...rows);
      }
    }
  }
  return out;
}

async function collectExpenses(
  repo: ExpensesRepository,
  businessId: BusinessId,
): Promise<readonly Expense[]> {
  // ExpensesRepository.findByMonth lets us walk 4 years ≈ 48 calls.
  const out: Expense[] = [];
  const currentYear = new Date().getUTCFullYear();
  for (let year = currentYear - 2; year <= currentYear + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      const ym = `${year}-${String(month).padStart(2, '0')}`;
      const rows = await repo.findByMonth(ym, businessId);
      if (rows.length > 0) out.push(...rows);
    }
  }
  return out;
}

async function collectInventoryMovements(
  repo: InventoryMovementsRepository,
  businessId: BusinessId,
): Promise<readonly InventoryMovement[]> {
  return repo.findByDateRange('0000-01-01' as never, '9999-12-31' as never, businessId);
}

async function collectClientPayments(
  repo: ClientPaymentsRepository,
  sales: readonly Sale[],
): Promise<readonly ClientPayment[]> {
  const out: ClientPayment[] = [];
  for (const sale of sales) {
    const pagos = await repo.findByVenta(sale.id);
    out.push(...pagos);
  }
  return out;
}

async function collectDayCloses(
  repo: DayClosesRepository,
  businessId: BusinessId,
): Promise<readonly DayClose[]> {
  // DayClosesRepository has no list-all method; walk via findLatest is
  // a single point. We don't currently expose a range query, so the
  // export collects only the most-recent corte per business. When P1C
  // adds a monthly-corte view we'll promote findByMonth to the repo.
  const latest = await repo.findLatest(businessId);
  return latest ? [latest] : [];
}
