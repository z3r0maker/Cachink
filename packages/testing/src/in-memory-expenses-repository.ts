/**
 * In-memory {@link ExpensesRepository}. Filters happen via simple `.filter`
 * + comparison; production workloads use the Drizzle impl.
 */

import type {
  BusinessId,
  DeviceId,
  Expense,
  ExpenseCategory,
  ExpenseId,
  IsoDate,
  IsoTimestamp,
  NewExpense,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { ExpensesRepository } from '@cachink/data';

export class InMemoryExpensesRepository implements ExpensesRepository {
  private readonly rows = new Map<ExpenseId, Expense>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewExpense): Promise<Expense> {
    const id = newEntityId<ExpenseId>();
    const ts = now();
    const row: Expense = {
      id,
      fecha: input.fecha,
      concepto: input.concepto,
      categoria: input.categoria,
      monto: input.monto,
      proveedor: input.proveedor ?? null,
      gastoRecurrenteId: input.gastoRecurrenteId ?? null,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(id: ExpenseId): Promise<Expense | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findByDate(date: IsoDate, businessId: BusinessId): Promise<readonly Expense[]> {
    return this.#live()
      .filter((r) => r.fecha === date && r.businessId === businessId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByMonth(yearMonth: string, businessId: BusinessId): Promise<readonly Expense[]> {
    return this.#live()
      .filter((r) => r.fecha.startsWith(`${yearMonth}-`) && r.businessId === businessId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByCategory(
    categoria: ExpenseCategory,
    businessId: BusinessId,
    from: IsoDate,
    to: IsoDate,
  ): Promise<readonly Expense[]> {
    return this.#live()
      .filter(
        (r) =>
          r.categoria === categoria &&
          r.businessId === businessId &&
          r.fecha >= from &&
          r.fecha <= to,
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  async delete(id: ExpenseId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }

  #live(): Expense[] {
    return [...this.rows.values()].filter((r) => r.deletedAt === null);
  }
}
